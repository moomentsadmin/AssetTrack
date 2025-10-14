import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Asset, Location } from "@shared/schema";
import { useBranding } from "@/hooks/use-branding";
import { format } from "date-fns";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintLabelPage() {
  const [, params] = useRoute("/assets/:id/print-label");
  const assetId = params?.id;

  const { data: asset, isLoading } = useQuery<Asset>({
    queryKey: ["/api/assets", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const res = await fetch(`/api/assets/${assetId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch asset: ${res.statusText}`);
      }
      return res.json();
    },
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { companyName, companyLogo } = useBranding();
  
  const locationName = asset?.locationId 
    ? locations.find(loc => loc.id === asset.locationId)?.name 
    : undefined;

  // Auto-trigger print dialog after content loads
  useEffect(() => {
    if (asset) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [asset]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Asset not found</p>
      </div>
    );
  }

  // Get current URL for QR code (asset details page)
  const assetUrl = `${window.location.origin}/assets/${asset.id}`;

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Button onClick={() => window.print()} data-testid="button-print">
          <Printer className="mr-2 h-4 w-4" />
          Print Label
        </Button>
      </div>

      {/* Printable labels - 2 per page */}
      <div className="print-container">
        {/* First Label */}
        <div className="asset-label">
          <div className="label-left">
            <div className="qr-code">
              <QRCodeSVG
                value={assetUrl}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="asset-id">{asset.serialNumber || asset.id.slice(0, 13)}</div>
          </div>

          <div className="label-divider" />

          <div className="label-right">
            {companyLogo && (
              <div className="company-logo">
                <img src={companyLogo} alt={companyName} />
              </div>
            )}
            <div className="company-name">{companyName}</div>
            
            <div className="asset-info">
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">{locationName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">
                  {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MM/dd/yyyy') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="asset-description">
              {asset.name}
            </div>
          </div>
        </div>

        {/* Second Label (duplicate for cutting) */}
        <div className="asset-label">
          <div className="label-left">
            <div className="qr-code">
              <QRCodeSVG
                value={assetUrl}
                size={140}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="asset-id">{asset.serialNumber || asset.id.slice(0, 13)}</div>
          </div>

          <div className="label-divider" />

          <div className="label-right">
            {companyLogo && (
              <div className="company-logo">
                <img src={companyLogo} alt={companyName} />
              </div>
            )}
            <div className="company-name">{companyName}</div>
            
            <div className="asset-info">
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span className="info-value">{locationName || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date:</span>
                <span className="info-value">
                  {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MM/dd/yyyy') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="asset-description">
              {asset.name}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Screen styles */
        .no-print {
          display: block;
        }

        .print-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 2rem;
          background: hsl(var(--muted)/0.3);
        }

        .asset-label {
          width: 85mm;
          height: 54mm;
          background: white;
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          display: flex;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .label-left {
          flex: 0 0 45%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: white;
        }

        .qr-code {
          margin-bottom: 4px;
        }

        .asset-id {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          color: black;
          letter-spacing: -0.5px;
        }

        .label-divider {
          width: 1px;
          background: hsl(var(--border));
          flex-shrink: 0;
        }

        .label-right {
          flex: 1;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: hsl(var(--muted)/0.3);
        }

        .company-logo {
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 2px;
        }

        .company-logo img {
          max-height: 100%;
          max-width: 120px;
          object-fit: contain;
        }

        .company-name {
          font-size: 11px;
          font-weight: 600;
          color: black;
          margin-bottom: 4px;
        }

        .asset-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 4px;
        }

        .info-row {
          display: flex;
          gap: 4px;
          font-size: 10px;
        }

        .info-label {
          font-weight: 600;
          color: hsl(var(--muted-foreground));
        }

        .info-value {
          font-weight: 500;
          color: black;
        }

        .asset-description {
          font-size: 10px;
          font-weight: 600;
          color: black;
          line-height: 1.3;
          max-height: 2.6em;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Print styles */
        @media print {
          @page {
            size: A4;
            margin: 0.5cm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            min-height: auto;
            padding: 0;
            background: white;
            gap: 1cm;
          }

          .asset-label {
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #000;
          }

          .label-right {
            background: #f5f5f5;
          }

          /* Ensure holes are visible in print */
          .asset-label::before,
          .asset-label::after {
            content: '';
            position: absolute;
            width: 6mm;
            height: 6mm;
            border: 1px solid #ccc;
            border-radius: 50%;
            background: white;
            top: 50%;
            transform: translateY(-50%);
          }

          .asset-label::before {
            left: 8mm;
          }

          .asset-label::after {
            right: 8mm;
          }
        }
      `}</style>
    </>
  );
}
