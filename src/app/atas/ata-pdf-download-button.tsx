import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

export function AtaPdfDownloadButton({
  ataId,
  className = "responsavel-action-menu-item",
  compact = false,
  onComplete,
}: {
  ataId: string;
  className?: string;
  compact?: boolean;
  onComplete?: () => void;
}) {
  return (
    <div className={compact ? "ata-pdf-action-compact" : "ata-pdf-action"}>
      <a
        href={`/atas/${ataId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onComplete}
        role={compact ? "menuitem" : undefined}
      >
        <FontAwesomeIcon icon={faFilePdf} />
        <span>Visualizar PDF</span>
      </a>
    </div>
  );
}
