"use client";

import { useEffect, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCalendarDays,
  faChevronDown,
  faClock,
  faComments,
  faDesktop,
  faFileCircleCheck,
  faFolder,
  faGlobe,
  faHashtag,
  faLocationDot,
  faTableCellsLarge,
  faTicket,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { formatReviewDate } from "./nova/ata-review";

export type AtaReviewLayoutData = {
  group: string;
  date: string;
  time: string;
  filledBy: string;
  platform: string;
  meetingType: string;
  formats: string;
  membersPresent: number;
  shares: number;
  additionalInformation?: { label: string; value: string }[];
  servers: { id: string; name: string; role?: string }[];
  locations: { id: string; name: string; count: number; detail?: string }[];
  internationalMembers: { id: string; country: string; count: number }[];
  visitors: {
    id: string;
    label: string;
    city: string;
    category: string;
    origin: string;
  }[];
  admissions: { id: string; label: string; city: string; state: string }[];
  achievements: { id: string; label: string; time: string }[];
  supplementalMetrics?: {
    cities: number;
    states: number;
    otherCountries: number;
  };
};

type AtaReviewIdentification = {
  groupReference: string;
  sequential: number;
  internalId: string;
  editor: ReactNode;
};

function ReviewSection({
  icon,
  title,
  count,
  desktop,
  children,
}: {
  icon: IconDefinition;
  title: string;
  count: number;
  desktop: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(count > 0);

  return (
    <details
      className="review-section"
      open={desktop || open}
      onToggle={(event) => {
        if (!desktop) setOpen(event.currentTarget.open);
      }}
    >
      <summary>
        <span className="review-section-heading">
          <span className="review-section-icon" aria-hidden="true">
            <FontAwesomeIcon icon={icon} />
          </span>
          <span>{title}</span>
        </span>
        <span className="review-section-summary-end">
          <span className="review-section-count" aria-label={`${count} registros`}>{count}</span>
          <FontAwesomeIcon className="review-section-chevron" icon={faChevronDown} aria-hidden="true" />
        </span>
      </summary>
      <div className="review-section-content">{children}</div>
    </details>
  );
}

function ReviewEmptyState({ icon, children }: { icon: IconDefinition; children: ReactNode }) {
  return (
    <div className="review-empty-state">
      <FontAwesomeIcon icon={icon} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function AtaReviewLayout({
  title,
  description,
  titleId,
  headingLevel = "h2",
  data,
  showFilledBy = true,
  headerAction,
  headerBadge,
  identification,
  footer,
  className = "",
}: {
  title: string;
  description?: string;
  titleId: string;
  headingLevel?: "h1" | "h2";
  data: AtaReviewLayoutData;
  showFilledBy?: boolean;
  headerAction?: ReactNode;
  headerBadge?: ReactNode;
  identification?: AtaReviewIdentification;
  footer?: ReactNode;
  className?: string;
}) {
  const [desktop, setDesktop] = useState(false);
  const Heading = headingLevel;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 981px)");
    const updateLayout = () => setDesktop(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  return (
    <div className={`ata-review-layout ${className}`.trim()}>
      <header className="review-layout-header">
        <div className="review-modal-header">
          <span className="review-modal-header-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faFileCircleCheck} />
          </span>
          <div>
            <Heading id={titleId}>{title}</Heading>
            {description && <p>{description}</p>}
          </div>
        </div>
        {(headerAction || headerBadge) && (
          <div className="review-layout-header-actions">
            {headerBadge}
            {headerAction}
          </div>
        )}
      </header>

      <dl className="review-grid">
        <div className="review-info-card review-info-card--group">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>
          <div><dt>Grupo</dt><dd>{data.group}</dd></div>
        </div>
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faCalendarDays} /></span>
          <div><dt>Data e hora</dt><dd>{formatReviewDate(data.date)} às {data.time}</dd></div>
        </div>
        {showFilledBy && data.filledBy && data.filledBy !== "Não informado" && (
          <div className="review-info-card">
            <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUser} /></span>
            <div><dt>Preenchido por</dt><dd>{data.filledBy}</dd></div>
          </div>
        )}
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faFolder} /></span>
          <div><dt>Tipo</dt><dd>{data.meetingType}</dd></div>
        </div>
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faDesktop} /></span>
          <div><dt>Plataforma</dt><dd>{data.platform}</dd></div>
        </div>
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faTableCellsLarge} /></span>
          <div><dt>Formatos</dt><dd>{data.formats}</dd></div>
        </div>
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>
          <div><dt>Membros presentes</dt><dd>{data.membersPresent}</dd></div>
        </div>
        <div className="review-info-card">
          <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faComments} /></span>
          <div><dt>Partilhas</dt><dd>{data.shares}</dd></div>
        </div>
      </dl>

      {data.additionalInformation && data.additionalInformation.length > 0 && (
        <dl className="review-additional-information" aria-label="Informações adicionais da ata">
          {data.additionalInformation.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      )}

      {identification && (
        <section className="review-identification" aria-labelledby="review-identification-title">
          <div className="review-identification-heading">
            <span className="review-section-icon" aria-hidden="true"><FontAwesomeIcon icon={faHashtag} /></span>
            <h2 id="review-identification-title">Índice personalizado do grupo</h2>
          </div>
          <dl className="review-identification-grid">
            <div><dt>Número da ata</dt><dd>{identification.groupReference}</dd></div>
          </dl>
          {identification.editor}
        </section>
      )}

      <dl className="review-metrics" aria-label="Totais da ata">
        <div><FontAwesomeIcon icon={faUsers} aria-hidden="true" /><dt>Servidores</dt><dd>{data.servers.length}</dd></div>
        <div><FontAwesomeIcon icon={faUsers} aria-hidden="true" /><dt>Membros</dt><dd>{data.membersPresent}</dd></div>
        <div><FontAwesomeIcon icon={faComments} aria-hidden="true" /><dt>Partilhas</dt><dd>{data.shares}</dd></div>
        <div><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><dt>Cidades</dt><dd>{data.supplementalMetrics?.cities ?? data.locations.length}</dd></div>
        <div><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><dt>Estados</dt><dd>{data.supplementalMetrics?.states ?? 0}</dd></div>
        <div><FontAwesomeIcon icon={faGlobe} aria-hidden="true" /><dt>Países</dt><dd>{data.supplementalMetrics?.otherCountries ?? data.internationalMembers.length}</dd></div>
        <div><FontAwesomeIcon icon={faUsers} aria-hidden="true" /><dt>Visitantes</dt><dd>{data.visitors.length}</dd></div>
        <div><FontAwesomeIcon icon={faTicket} aria-hidden="true" /><dt>Ingressos</dt><dd>{data.admissions.length}</dd></div>
        <div><FontAwesomeIcon icon={faClock} aria-hidden="true" /><dt>Conquistas de tempo</dt><dd>{data.achievements.length}</dd></div>
      </dl>

      <div className="review-sections">
        <ReviewSection icon={faUsers} title="Servidores" count={data.servers.length} desktop={desktop}>
          {data.servers.length ? (
            <ol className="review-item-list review-item-list--ordered">
              {data.servers.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  {item.role && <span className="review-item-badge">{item.role}</span>}
                </li>
              ))}
            </ol>
          ) : <ReviewEmptyState icon={faUsers}>Nenhum servidor registrado.</ReviewEmptyState>}
        </ReviewSection>

        <ReviewSection icon={faLocationDot} title="Localidades" count={data.locations.length} desktop={desktop}>
          {data.locations.length ? (
            <ul className="review-item-list">
              {data.locations.map((item, index) => (
                <li key={item.id}>
                  <span className="review-item-main">
                    <span>{index + 1}. {item.name}</span>
                    {item.detail && <small>{item.detail}</small>}
                  </span>
                  <span className="review-item-count">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : <ReviewEmptyState icon={faLocationDot}>Nenhuma localidade registrada.</ReviewEmptyState>}
        </ReviewSection>

        <ReviewSection icon={faGlobe} title="Membros internacionais" count={data.internationalMembers.length} desktop={desktop}>
          {data.internationalMembers.length ? (
            <ul className="review-item-list">
              {data.internationalMembers.map((item, index) => (
                <li key={item.id}><span>{index + 1}. {item.country}</span><span className="review-item-count">{item.count}</span></li>
              ))}
            </ul>
          ) : <ReviewEmptyState icon={faGlobe}>Nenhum membro internacional registrado.</ReviewEmptyState>}
        </ReviewSection>

        <ReviewSection icon={faUsers} title="Visitantes" count={data.visitors.length} desktop={desktop}>
          {data.visitors.length ? (
            <div className="review-table-wrap">
              <table className="review-table"><thead><tr><th>Visitante</th><th>Cidade</th><th>Categoria</th><th>Origem</th></tr></thead>
                <tbody>{data.visitors.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Visitante">{item.label}</td>
                    <td data-label="Cidade">{item.city}</td>
                    <td data-label="Categoria">{item.category}</td>
                    <td data-label="Origem">{item.origin}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <ReviewEmptyState icon={faUsers}>Nenhum visitante registrado.</ReviewEmptyState>}
        </ReviewSection>

        <ReviewSection icon={faTicket} title="Ingressos" count={data.admissions.length} desktop={desktop}>
          {data.admissions.length ? (
            <div className="review-table-wrap">
              <table className="review-table"><thead><tr><th>Ingresso</th><th>Cidade</th><th>Estado</th></tr></thead>
                <tbody>{data.admissions.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Ingresso">{item.label}</td>
                    <td data-label="Cidade">{item.city}</td>
                    <td data-label="Estado">{item.state}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <ReviewEmptyState icon={faTicket}>Nenhum ingresso registrado.</ReviewEmptyState>}
        </ReviewSection>

        <ReviewSection icon={faClock} title="Conquistas de tempo" count={data.achievements.length} desktop={desktop}>
          {data.achievements.length ? (
            <div className="review-table-wrap">
              <table className="review-table"><thead><tr><th>Conquista</th><th>Tempo</th></tr></thead>
                <tbody>{data.achievements.map((item) => (
                  <tr key={item.id}><td data-label="Conquista">{item.label}</td><td data-label="Tempo">{item.time}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : <ReviewEmptyState icon={faClock}>Nenhuma conquista registrada.</ReviewEmptyState>}
        </ReviewSection>
      </div>

      {footer}
    </div>
  );
}
