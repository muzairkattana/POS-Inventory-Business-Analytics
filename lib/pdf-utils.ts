import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  scale?: number;
}

function ensureImagesLoaded(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  // Set crossOrigin on relative images to help html2canvas
  images.forEach((img) => {
    try {
      const url = new URL(img.src, window.location.origin);
      if (url.origin === window.location.origin) {
        img.crossOrigin = 'anonymous';
      }
    } catch {
      // ignore invalid URL
    }
  });
  return new Promise((resolve) => {
    if (images.length === 0) return resolve();
    let loaded = 0;
    const done = () => {
      loaded += 1;
      if (loaded >= images.length) resolve();
    };
    images.forEach((img) => {
      if (img.complete) return done();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  });
}

function prepareClone(element: HTMLElement): { container: HTMLDivElement; target: HTMLElement } {
  // Create off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = 'auto';
  container.style.zIndex = '-1';

  // Deep clone the element to avoid visual flicker
  const target = element.cloneNode(true) as HTMLElement;

  // Neutralize transforms and effects that can break rendering size
  target.style.transform = 'none';
  (target.style as any).scale = '1';
  target.style.transformOrigin = 'top left';
  target.style.boxShadow = 'none';
  target.style.background = '#ffffff';

  // Try to preserve on-screen width to avoid unexpected reflow sizes
  const rect = element.getBoundingClientRect();
  if (rect.width) {
    target.style.width = `${rect.width}px`;
  }

  // Also try to remove Tailwind scale classes if present
  target.className = target.className
    .split(' ')
    .filter((cls) => !cls.startsWith('scale-') && !cls.startsWith('scale['))
    .join(' ');

  // Mark as cloned so downstream can skip re-cloning
  target.setAttribute('data-cloned', 'true');

  container.appendChild(target);
  document.body.appendChild(container);
  return { container, target };
}

export const generateInvoicePDFForSharing = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<Blob> => {
  const {
    filename = `invoice-${Date.now()}.pdf`,
    format = 'a4',
    orientation = 'portrait',
    quality = 1,
    scale = 1.0,
  } = options;

  // If element is an already prepared clone, use it directly. Otherwise, clone now.
  const isCloned = element.getAttribute && element.getAttribute('data-cloned') === 'true';
  const { container, target } = isCloned ? { container: null as any, target: element } : prepareClone(element);

  try {
    // Ensure images are loaded to prevent tainted canvas issues
    await ensureImagesLoaded(target as HTMLElement);

    // Render element at full size for better quality, but avoid huge scales for stability
    const canvas = await html2canvas(target as HTMLElement, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      foreignObjectRendering: true,
    });

    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Fit the entire invoice on one page while preserving aspect ratio
    const widthRatio = pdfWidth / imgWidth;
    const heightRatio = pdfHeight / imgHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Center the content
    const xPosition = (pdfWidth - scaledWidth) / 2;
    const yPosition = (pdfHeight - scaledHeight) / 2;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', xPosition, yPosition, scaledWidth, scaledHeight);

    // Return PDF as blob for sharing
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Cleanup only if we created a container
    if ((container as HTMLDivElement)?.parentNode) {
      document.body.removeChild(container as HTMLDivElement);
    }
  }
};

export const generateInvoicePDF = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = `invoice-${Date.now()}.pdf`,
    format = 'a4',
    orientation = 'portrait',
    quality = 1,
    scale = 1.0,
  } = options;

  // If element is an already prepared clone, use it directly. Otherwise, clone now.
  const isCloned = element.getAttribute && element.getAttribute('data-cloned') === 'true';
  const { container, target } = isCloned ? { container: null as any, target: element } : prepareClone(element);

  try {
    // Ensure images are loaded to prevent tainted canvas issues
    await ensureImagesLoaded(target as HTMLElement);

    // Render element at full size for better quality, but avoid huge scales for stability
    const canvas = await html2canvas(target as HTMLElement, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      foreignObjectRendering: true,
    });

    const imgData = canvas.toDataURL('image/png', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Fit the entire invoice on one page while preserving aspect ratio
    const widthRatio = pdfWidth / imgWidth;
    const heightRatio = pdfHeight / imgHeight;
    const ratio = Math.min(widthRatio, heightRatio);

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;

    // Center the content
    const xPosition = (pdfWidth - scaledWidth) / 2;
    const yPosition = (pdfHeight - scaledHeight) / 2;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', xPosition, yPosition, scaledWidth, scaledHeight);

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Cleanup only if we created a container
    if ((container as HTMLDivElement)?.parentNode) {
      document.body.removeChild(container as HTMLDivElement);
    }
  }
};

export const printInvoice = async (element: HTMLElement): Promise<void> => {
  try {
    // Render the element to an image to preserve layout consistency
    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // Create a hidden iframe to print without opening a new tab/window
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('Could not access print frame');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice</title>
          <style>
            html, body { height: 100%; }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: #ffffff;
            }
            .invoice-image {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            @media print {
              @page { size: A4; margin: 0.5in; }
              body { margin: 0; padding: 0; }
              .invoice-image {
                width: 100%;
                height: auto;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Invoice" class="invoice-image" />
        </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 100);
    };
  } catch (error) {
    console.error('Error printing invoice:', error);
    // Fallback to regular window.print()
    window.print();
  }
};

export const generateOptimizedPDF = async (
  element: HTMLElement,
  invoiceData: any,
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = `invoice-${invoiceData.invoiceNumber || Date.now()}.pdf`,
    format = 'a4',
    orientation = 'portrait',
  } = options;

  // Work on a normalized, off-screen clone to avoid transform/scale issues
  const { container, target } = prepareClone(element);

  try {
    // Hide non-printable elements in the clone
    const printElements = target.querySelectorAll('.print\\:hidden');

    printElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });

    // Show print-only elements in the clone
    const printOnlyElements = target.querySelectorAll('.hidden.print\\:block');

    printOnlyElements.forEach((el) => {
      (el as HTMLElement).style.display = 'block';
    });

    // Generate PDF from the already-cloned target (generateInvoicePDF will detect it's cloned and skip re-clone)
    await generateInvoicePDF(target, { filename, format, orientation, scale: 1.6, quality: 0.98 });
  } catch (error) {
    console.error('Error generating optimized PDF:', error);
    // Provide a simpler fallback at lower scale
    try {
      await generateInvoicePDF(target, { filename, format, orientation, scale: 1.0, quality: 0.92 });
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw fallbackError;
    }
  } finally {
    // Cleanup cloned container from DOM
    if (container?.parentNode) document.body.removeChild(container);
  }
};
