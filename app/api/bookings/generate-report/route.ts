import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Bookings';
import { verifyToken, hasPermission } from '@/lib/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// ====================================
// TYPE DEFINITIONS
// ====================================

interface DecodedToken {
  userId: string;
  role: string;
}

interface ReportRequestBody {
  filters: {
    date?: string;
    routeId?: string;
    busId?: string;
    status?: string;
    paymentStatus?: string;
  };
  bookings?: string[];
}

interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface IBus {
  _id: string;
  busNumber: string;
  type: string;
  capacity: number;
  departureTime: string;
}

interface IRoute {
  _id: string;
  name: string;
  fromLocation: string;
  toLocation: string;
  price: number;
  distance: number;
  duration: string;
}

interface IPopulatedBooking {
  _id: { toString: () => string };
  userId: IUser;
  busId: IBus;
  routeId: IRoute;
  passengerName: string;
  passengerPhone: string;
  travelDate: Date;
  pickupLocation: string;
  seatNumbers: string[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}

// ====================================
// NOTO SANS SINHALA FONT (Base64)
// ====================================
// This is a subset of Noto Sans Sinhala Regular font
// For production, you should host the full font file
const NotoSansSinhalaFont = `
Add your base64 encoded font here - See instructions below
`;

// ====================================
// HELPER FUNCTION TO ADD FONT
// ====================================
function addSinhalaFont(doc: jsPDF) {
  try {
    // Only add if font string is available
    if (NotoSansSinhalaFont && NotoSansSinhalaFont.length > 100) {
      doc.addFileToVFS('NotoSansSinhala-Regular.ttf', NotoSansSinhalaFont);
      doc.addFont('NotoSansSinhala-Regular.ttf', 'NotoSansSinhala', 'normal');
      doc.setFont('NotoSansSinhala');
      return true;
    }
  } catch (error) {
    console.error('Error adding Sinhala font:', error);
  }
  return false;
}

// ====================================
// HELPER FUNCTION TO SANITIZE TEXT
// ====================================
function sanitizeText(text: string): string {
  if (!text) return '';
  // Normalize Unicode and ensure proper encoding
  return text.normalize('NFC').trim();
}

// ====================================
// API ROUTE HANDLER
// ====================================

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION & AUTHORIZATION
    const token = request.cookies.get('authToken')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as DecodedToken;
    if (!hasPermission(decoded.role, 'bookings:read')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // 2. PARSE REQUEST BODY & FETCH DATA
    const body: ReportRequestBody = await request.json();
    const { filters, bookings: bookingIds } = body;

    await connectToDatabase();

    // Build query based on filters
    const query: any = {
      status: { $in: ['pending', 'confirmed'] }
    };

    if (filters.date) {
      query.travelDate = new Date(filters.date);
    }
    if (filters.routeId) {
      query.routeId = filters.routeId;
    }
    if (filters.busId) {
      query.busId = filters.busId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.paymentStatus) {
      query.paymentStatus = filters.paymentStatus;
    }

    const bookings: IPopulatedBooking[] = await Booking.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('busId', 'busNumber type capacity departureTime contactNumber')
      .populate('routeId', 'name fromLocation toLocation price distance duration')
      .sort({ 'seatNumbers.0': 1 }) // Sort by first seat number ascending (1, 2, 3...)
      .lean();

    // Fetch all booked seats for the given filters
    let allBookedSeats: number[] = [];
    let busDetails: IBus | null = null;
    let routeDetails: IRoute | null = null;

    if (filters.date && filters.routeId && filters.busId) {
      const filterQuery: any = {
        travelDate: new Date(filters.date),
        routeId: filters.routeId,
        busId: filters.busId,
        status: { $in: ['confirmed', 'pending'] }
      };

      const allBookingsForLayout = await Booking.find(filterQuery)
        .select('seatNumbers')
        .populate('busId', 'busNumber type capacity departureTime contactNumber')
        .populate('routeId', 'name fromLocation toLocation')
        .lean();

      allBookedSeats = allBookingsForLayout.flatMap(booking =>
        (booking.seatNumbers as any[]).map(seat => parseInt(seat.toString()))
      );

      if (bookings.length > 0) {
        busDetails = bookings[0].busId;
        routeDetails = bookings[0].routeId;
      }
    }

    // 3. PDF DOCUMENT SETUP
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true
    });

    // Try to add Sinhala font support
    const hasSinhalaFont = addSinhalaFont(doc);
    
    // Fallback to default font if Sinhala font is not available
    if (!hasSinhalaFont) {
      try {
        doc.setFont('helvetica', 'normal');
      } catch (error) {
        doc.setFont('courier', 'normal');
      }
    }

    const margins = { top: 20, right: 15, bottom: 25, left: 15 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPos = margins.top;

    // ====================================
    // PDF HEADER SECTION
    // ====================================
    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 51, 102);
    doc.text('BOOKING REPORT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Seat Booking Management System', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(margins.left, yPos, pageWidth - margins.right, yPos);
    yPos += 8;

    // Report metadata
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
    doc.text('Generated:', margins.left, yPos);
    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(format(new Date(), 'dd MMMM yyyy, HH:mm'), margins.left + 25, yPos);

    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Total Records:', pageWidth - margins.right - 40, yPos);
    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(bookings.length.toString(), pageWidth - margins.right - 10, yPos, { align: 'right' });
    yPos += 10;

    // ====================================
    // APPLIED FILTERS SECTION
    // ====================================
    const hasFilters = Object.values(filters).some(value => value);
    if (hasFilters) {
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margins.left, yPos, contentWidth, 28, 2, 2, 'F');
      yPos += 5;

      doc.setFontSize(11);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('APPLIED FILTERS', margins.left + 3, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
      const filterXLeft = margins.left + 3;
      const filterXRight = margins.left + contentWidth / 2 + 5;
      let filterYLeft = yPos;
      let filterYRight = yPos;

      const addFilter = (label: string, value: string, isLeftColumn: boolean) => {
        const xPos = isLeftColumn ? filterXLeft : filterXRight;
        const currentY = isLeftColumn ? filterYLeft : filterYRight;

        doc.setTextColor(80, 80, 80);
        doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
        doc.text(`${label}:`, xPos, currentY);

        doc.setTextColor(0, 0, 0);
        doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
        const labelWidth = doc.getTextWidth(`${label}: `);
        doc.text(sanitizeText(value), xPos + labelWidth, currentY);

        if (isLeftColumn) {
          filterYLeft += 5;
        } else {
          filterYRight += 5;
        }
      };

      let isLeft = true;
      if (filters.date) {
        addFilter('Travel Date', format(new Date(filters.date), 'dd MMMM yyyy'), isLeft);
        isLeft = !isLeft;
      }
      if (filters.status) {
        addFilter('Status', filters.status.toUpperCase(), isLeft);
        isLeft = !isLeft;
      }
      if (filters.paymentStatus) {
        addFilter('Payment', filters.paymentStatus.toUpperCase(), isLeft);
        isLeft = !isLeft;
      }
      if (routeDetails) {
        addFilter('Route', `${sanitizeText(routeDetails.fromLocation)} - ${sanitizeText(routeDetails.toLocation)}`, isLeft);
        isLeft = !isLeft;
      }
      if (busDetails) {
        addFilter('Bus', `${sanitizeText(busDetails.busNumber)} (${busDetails.departureTime})`, isLeft);
        isLeft = !isLeft;
      }

      yPos = Math.max(filterYLeft, filterYRight) + 5;
    }

    // ====================================
    // BOOKING DETAILS TABLE
    // ====================================
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margins.top;
    }

    doc.setFontSize(12);
    doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('BOOKING DETAILS', margins.left, yPos);
    yPos += 2;

    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.3);
    doc.line(margins.left, yPos, margins.left + 45, yPos);
    yPos += 6;

    const tableData = bookings.map((booking, index) => [
      (index + 1).toString(),
      `#${booking._id.toString().slice(-6).toUpperCase()}`,
      sanitizeText(booking.passengerName || 'N/A'),
      sanitizeText(booking.passengerPhone || ''),
      sanitizeText((booking.pickupLocation || '').length > 20 ? 
        (booking.pickupLocation || '').substring(0, 17) + '...' : 
        (booking.pickupLocation || '')),
      (booking.seatNumbers as any[]).join(', '),
      format(new Date(booking.travelDate), 'dd MMM yyyy'),
      `LKR ${booking.totalAmount.toLocaleString()}`,
      booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
      booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)
    ]);

    autoTable(doc, {
      head: [[
        '#', 'Booking ID', 'Passenger', 'Phone', 'Pickup Location', 'Seats', 'Travel Date', 'Amount', 'Status', 'Payment'
      ]],
      body: tableData,
      startY: yPos,
      theme: 'grid',
      pageBreak: 'auto',
      rowPageBreak: 'auto',
      showHead: 'everyPage',
      tableWidth: 'auto',
      margin: { left: margins.left, right: margins.right },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        overflow: 'linebreak',
        font: hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica',
        fontStyle: 'normal',
      },
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
        font: hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 26 },
        5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 18, halign: 'center' },
        9: { cellWidth: 18, halign: 'center' }
      },
      didParseCell: (data) => {
        // Color code status column
        if (data.column.index === 8 && data.section === 'body') {
          const status = data.cell.text[0].toLowerCase();
          if (status === 'confirmed') {
            data.cell.styles.textColor = [40, 167, 69];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'pending') {
            data.cell.styles.textColor = [255, 193, 7];
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'cancelled') {
            data.cell.styles.textColor = [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Color code payment status column
        if (data.column.index === 9 && data.section === 'body') {
          const payment = data.cell.text[0].toLowerCase();
          if (payment === 'paid') {
            data.cell.styles.textColor = [40, 167, 69];
            data.cell.styles.fontStyle = 'bold';
          } else if (payment === 'pending') {
            data.cell.styles.textColor = [255, 193, 7];
            data.cell.styles.fontStyle = 'bold';
          } else if (payment === 'refunded') {
            data.cell.styles.textColor = [108, 117, 125];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // ====================================
    // SEAT LAYOUT SECTION
    // ====================================
    if (busDetails && routeDetails) {
      if (yPos > pageHeight - 140) {
        doc.addPage();
        yPos = margins.top;
      }

      doc.setFontSize(12);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('BUS SEAT LAYOUT', margins.left, yPos);
      yPos += 2;

      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.3);
      doc.line(margins.left, yPos, margins.left + 38, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(
        `Bus: ${sanitizeText(busDetails.busNumber)} | Route: ${sanitizeText(routeDetails.fromLocation)} → ${sanitizeText(routeDetails.toLocation)} | Date: ${format(new Date(filters.date!), 'dd MMM yyyy')}`,
        margins.left,
        yPos
      );
      yPos += 6;

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Total Capacity: ${busDetails.capacity} | Booked Seats: ${allBookedSeats.length} | Available: ${busDetails.capacity - allBookedSeats.length}`,
        margins.left,
        yPos
      );
      yPos += 8;

      const leftColumnRows = [
        [4, 3], [8, 7], [12, 11], [16, 15], [20, 19],
        [24, 23], [28, 27], [32, 31], [36, 35], [40, 39], [44, 43]
      ];
      const rightColumnRows = [
        [2, 1], [6, 5], [10, 9], [14, 13], [18, 17],
        [22, 21], [26, 25], [30, 29], [34, 33], [38, 37], [42, 41]
      ];
      const backRowSeats = [49, 48, 47, 46, 45];

      const formatSeat = (seatNumber: number): string => {
        return seatNumber.toString().padStart(2, '0');
      };

      const busLayoutWidth = 110;
      const busLayoutX = (pageWidth - busLayoutWidth) / 2;

      const seatTableBody = [];
      const maxRows = Math.max(leftColumnRows.length, rightColumnRows.length);

      for (let i = 0; i < maxRows; i++) {
        const left = leftColumnRows[i] || [];
        const right = rightColumnRows[i] || [];
        seatTableBody.push([
          left.length > 0 ? formatSeat(left[0]) : '',
          left.length > 1 ? formatSeat(left[1]) : '',
          '     ',
          right.length > 0 ? formatSeat(right[0]) : '',
          right.length > 1 ? formatSeat(right[1]) : '',
        ]);
      }

      autoTable(doc, {
        body: seatTableBody,
        startY: yPos,
        theme: 'plain',
        tableWidth: busLayoutWidth,
        margin: { left: busLayoutX },
        styles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          cellPadding: 3,
          minCellHeight: 9,
          lineColor: [180, 180, 180],
          lineWidth: 0.3,
          font: hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica',
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30, fontStyle: 'italic', textColor: [150, 150, 150] },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index !== 2) {
            const seatNumber = parseInt(data.cell.text[0]);
            if (!isNaN(seatNumber)) {
              const isBooked = allBookedSeats.includes(seatNumber);

              doc.setLineWidth(0.3);
              if (isBooked) {
                doc.setFillColor(220, 53, 69);
                doc.setDrawColor(200, 40, 50);
                doc.setTextColor(255, 255, 255);
              } else {
                doc.setFillColor(40, 167, 69);
                doc.setDrawColor(30, 140, 55);
                doc.setTextColor(255, 255, 255);
              }

              doc.roundedRect(
                data.cell.x + 2,
                data.cell.y + 1.5,
                data.cell.width - 4,
                data.cell.height - 3,
                1.5,
                1.5,
                'FD'
              );

              doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
              doc.setFontSize(9);
              doc.text(
                formatSeat(seatNumber),
                data.cell.x + data.cell.width / 2,
                data.cell.y + data.cell.height / 2 + 1.5,
                { align: 'center' }
              );
            }
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 2;

      autoTable(doc, {
        body: [backRowSeats.map(seat => formatSeat(seat))],
        startY: yPos,
        theme: 'plain',
        tableWidth: busLayoutWidth,
        margin: { left: busLayoutX },
        styles: {
          fontSize: 9,
          halign: 'center',
          valign: 'middle',
          cellPadding: 3,
          minCellHeight: 9,
          lineColor: [180, 180, 180],
          lineWidth: 0.3,
          font: hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica',
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            const seatNumber = parseInt(data.cell.text[0]);
            if (!isNaN(seatNumber)) {
              const isBooked = allBookedSeats.includes(seatNumber);

              doc.setLineWidth(0.3);
              if (isBooked) {
                doc.setFillColor(220, 53, 69);
                doc.setDrawColor(200, 40, 50);
                doc.setTextColor(255, 255, 255);
              } else {
                doc.setFillColor(40, 167, 69);
                doc.setDrawColor(30, 140, 55);
                doc.setTextColor(255, 255, 255);
              }

              doc.roundedRect(
                data.cell.x + 2,
                data.cell.y + 1.5,
                data.cell.width - 4,
                data.cell.height - 3,
                1.5,
                1.5,
                'FD'
              );

              doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
              doc.setFontSize(9);
              doc.text(
                formatSeat(seatNumber),
                data.cell.x + data.cell.width / 2,
                data.cell.y + data.cell.height / 2 + 1.5,
                { align: 'center' }
              );
            }
          }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 2;

      doc.setFillColor(108, 117, 125);
      doc.roundedRect(busLayoutX, yPos, busLayoutWidth, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('BACK OF BUS', pageWidth / 2, yPos + 4, { align: 'center' });
      yPos += 10;

      const legendStartX = pageWidth / 2 - 35;

      doc.setFillColor(40, 167, 69);
      doc.setDrawColor(30, 140, 55);
      doc.roundedRect(legendStartX, yPos, 8, 6, 1, 1, 'FD');
      doc.setTextColor(0, 0, 0);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Available Seat', legendStartX + 10, yPos + 4);

      doc.setFillColor(220, 53, 69);
      doc.setDrawColor(200, 40, 50);
      doc.roundedRect(legendStartX + 40, yPos, 8, 6, 1, 1, 'FD');
      doc.text('Booked Seat', legendStartX + 50, yPos + 4);

      yPos += 10;
    }

    // ====================================
    // FOOTER ON EACH PAGE
    // ====================================
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      const footerY = pageHeight - 15;

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margins.left, footerY, pageWidth - margins.right, footerY);

      doc.setFontSize(8);
      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
      doc.setTextColor(120, 120, 120);

      doc.text('Seat Booking Management System', margins.left, footerY + 5);

      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );

      doc.setFont(hasSinhalaFont ? 'NotoSansSinhala' : 'helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(
        format(new Date(), 'dd/MM/yyyy HH:mm'),
        pageWidth - margins.right,
        footerY + 5,
        { align: 'right' }
      );
    }

    // 5. GENERATE AND RETURN PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="booking-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating PDF report:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({
      success: false,
      message: 'Error generating PDF report',
      error: errorMessage
    }, { status: 500 });
  }
}