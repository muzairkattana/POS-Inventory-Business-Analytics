import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, HeadingLevel, BorderStyle } from 'docx';

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  items: any[];
  clientInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  companyInfo: {
    name: string;
    owner: string;
    address: string;
    phone1: string;
    phone2: string;
    email: string;
  };
  grandTotal: number;
}

export interface WordOptions {
  filename?: string;
}

export const generateInvoiceWord = async (
  invoiceData: InvoiceData,
  options: WordOptions = {}
): Promise<void> => {
  const { filename = `invoice-${invoiceData.invoiceNumber}.docx` } = options;

  try {
    // Calculate totals
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = invoiceData.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + (subtotal * (item.discount || 0)) / 100;
    }, 0);
    const totalTax = invoiceData.items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const afterDiscount = subtotal - (subtotal * (item.discount || 0)) / 100;
      return sum + (afterDiscount * (item.taxRate || 0)) / 100;
    }, 0);

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Company Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: invoiceData.companyInfo.name,
                bold: true,
                size: 32,
                color: "1e40af"
              })
            ]
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Owner: ${invoiceData.companyInfo.owner}`,
                size: 20
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: invoiceData.companyInfo.address,
                size: 18
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Phone: ${invoiceData.companyInfo.phone1} | ${invoiceData.companyInfo.phone2}`,
                size: 18
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Email: ${invoiceData.companyInfo.email}`,
                size: 18
              })
            ]
          }),

          new Paragraph({ text: "" }), // Empty line

          // Invoice Title and Details
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "INVOICE",
                bold: true,
                size: 28,
                color: "1e40af"
              })
            ]
          }),

          new Paragraph({ text: "" }), // Empty line

          // Invoice Details Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Invoice Number:", bold: true })
                      ]
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph(invoiceData.invoiceNumber)],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Invoice Date:", bold: true })
                      ]
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE }
                  }),
                  new TableCell({
                    children: [new Paragraph(new Date(invoiceData.invoiceDate).toLocaleDateString())],
                    width: { size: 20, type: WidthType.PERCENTAGE }
                  })
                ]
              }),
              ...(invoiceData.dueDate ? [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [
                          new TextRun({ text: "Due Date:", bold: true })
                        ]
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph(new Date(invoiceData.dueDate).toLocaleDateString())]
                    }),
                    new TableCell({ children: [new Paragraph("")] }),
                    new TableCell({ children: [new Paragraph("")] })
                  ]
                })
              ] : [])
            ]
          }),

          new Paragraph({ text: "" }), // Empty line

          // Bill To Section
          new Paragraph({
            children: [
              new TextRun({
                text: "Bill To:",
                bold: true,
                size: 24
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: invoiceData.clientInfo.name,
                bold: true,
                size: 20
              })
            ]
          }),

          new Paragraph(invoiceData.clientInfo.address),
          new Paragraph(invoiceData.clientInfo.city),
          new Paragraph(`Phone: ${invoiceData.clientInfo.phone}`),
          new Paragraph(`Email: ${invoiceData.clientInfo.email}`),

          new Paragraph({ text: "" }), // Empty line

          // Items Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Item", bold: true })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Description", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Qty", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Unit Price", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Tax %", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Discount %", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Total", bold: true, color: "FFFFFF" })
                      ],
                      alignment: AlignmentType.CENTER
                    })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: "1e40af" }
                  })
                ]
              }),
              // Data rows
              ...invoiceData.items
                .filter(item => item.description || item.quantity > 0 || item.unitPrice > 0)
                .map((item, index) => {
                  const itemSubtotal = item.quantity * item.unitPrice;
                  const discountAmount = (itemSubtotal * (item.discount || 0)) / 100;
                  const afterDiscount = itemSubtotal - discountAmount;
                  const taxAmount = (afterDiscount * (item.taxRate || 0)) / 100;
                  const total = afterDiscount + taxAmount;

                  return new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          text: String(index + 1),
                          alignment: AlignmentType.CENTER
                        })]
                      }),
                      new TableCell({
                        children: [new Paragraph(item.description || "")]
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          text: String(item.quantity || 0),
                          alignment: AlignmentType.CENTER
                        })]
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          text: `Rs ${(item.unitPrice || 0).toFixed(2)}`,
                          alignment: AlignmentType.RIGHT
                        })]
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          text: `${item.taxRate || 0}%`,
                          alignment: AlignmentType.CENTER
                        })]
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          text: `${item.discount || 0}%`,
                          alignment: AlignmentType.CENTER
                        })]
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          text: `Rs ${total.toFixed(2)}`,
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: `Rs ${total.toFixed(2)}`, bold: true })
                          ]
                        })]
                      })
                    ]
                  });
                })
            ]
          }),

          new Paragraph({ text: "" }), // Empty line

          // Totals Section
          new Table({
            width: {
              size: 50,
              type: WidthType.PERCENTAGE
            },
            alignment: AlignmentType.RIGHT,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Subtotal:", bold: true })
                      ],
                      alignment: AlignmentType.RIGHT
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: `Rs ${subtotal.toFixed(2)}`,
                      alignment: AlignmentType.RIGHT
                    })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Total Discount:", bold: true })
                      ],
                      alignment: AlignmentType.RIGHT
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: `-Rs ${totalDiscount.toFixed(2)}`,
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `-Rs ${totalDiscount.toFixed(2)}`, color: "dc2626" })
                      ]
                    })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Total Tax:", bold: true })
                      ],
                      alignment: AlignmentType.RIGHT
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: `Rs ${totalTax.toFixed(2)}`,
                      alignment: AlignmentType.RIGHT
                    })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [
                        new TextRun({ text: "Grand Total:", bold: true, size: 24 })
                      ],
                      alignment: AlignmentType.RIGHT
                    })],
                    shading: { fill: "1e40af" }
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      children: [
                        new TextRun({ text: `Rs ${invoiceData.grandTotal.toFixed(2)}`, bold: true, size: 24, color: "FFFFFF" })
                      ]
                    })],
                    shading: { fill: "1e40af" }
                  })
                ]
              })
            ]
          }),

          new Paragraph({ text: "" }), // Empty line
          new Paragraph({ text: "" }), // Empty line

          // Thank you section
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Thank You for Your Business!",
                bold: true,
                size: 24,
                color: "1e40af"
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "For any queries or assistance regarding this invoice, please don't hesitate to contact us.",
                size: 18
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "We value your trust and are committed to providing exceptional service.",
                bold: true,
                size: 18
              })
            ]
          })
        ]
      }]
    });

    // Generate and download the document
    const blob = await Packer.toBlob(doc);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating Word document:', error);
    throw new Error('Failed to generate Word document');
  }
};
