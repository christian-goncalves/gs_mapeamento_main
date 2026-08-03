"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

export function PrintDashboardButton() {
  return (
    <button
      type="button"
      className="dashboard-pdf-button"
      onClick={() => window.print()}
    >
      <span className="button-content">
        <FontAwesomeIcon icon={faFilePdf} />
        PDF
      </span>
    </button>
  );
}
