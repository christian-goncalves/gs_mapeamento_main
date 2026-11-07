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
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { formatReviewDate } from "./nova/ata-review";
import { buildAtaDetailColumnLayout, type AtaDetailSectionKey } from "./ata-detail-column-layout";

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
  detailPage,
  showDecorativeIcons,
  className = "",
  children,
}: {
  icon: IconDefinition;
  title: string;
  count: number;
  desktop: boolean;
  detailPage: boolean;
  showDecorativeIcons: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(count > 0);

  if (detailPage) return <>{children}</>;

  return (
    <details
      className={`review-section ${className}`.trim()}
      open={desktop || open}
      onToggle={(event) => {
        if (!desktop) setOpen(event.currentTarget.open);
      }}
    >
      <summary>
        <span className="review-section-heading">
          {showDecorativeIcons && (
            <span className="review-section-icon" aria-hidden="true">
              <FontAwesomeIcon icon={icon} />
            </span>
          )}
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

function ReviewEmptyState({
  icon,
  children,
  showDecorativeIcon,
}: {
  icon: IconDefinition;
  children: ReactNode;
  showDecorativeIcon: boolean;
}) {
  return (
    <div className="review-empty-state">
      {showDecorativeIcon && <FontAwesomeIcon icon={icon} aria-hidden="true" />}
      <span>{children}</span>
    </div>
  );
}

function ReviewBlock({
  enabled,
  id,
  title,
  children,
}: {
  enabled: boolean;
  id: string;
  title: string;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;

  return (
    <section className="review-block" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

function AtaDetailSection({
  sectionKey,
  data,
  desktop,
  detailPage,
  detailAppearance,
}: {
  sectionKey: AtaDetailSectionKey | "national";
  data: AtaReviewLayoutData;
  desktop: boolean;
  detailPage: boolean;
  detailAppearance: boolean;
}) {
  const showDecorativeIcons = !detailPage && !detailAppearance;

  if (sectionKey === "servers") {
    return (
      <ReviewSection className="review-section--servers" icon={faUsers} title="Servidores" count={data.servers.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={showDecorativeIcons}>
        <div className="review-table-wrap">
          <table className="review-table review-table--servers">
            <thead><tr><th>{detailPage || detailAppearance ? "Servidores" : "Servidor"}</th><th>Função</th></tr></thead>
            <tbody>{data.servers.length ? data.servers.map((item, index) => (
              <tr key={item.id}>
                <td data-label="Servidores">{index + 1}. {item.name}</td>
                <td data-label="Função">{item.role || "—"}</td>
              </tr>
            )) : <tr><td colSpan={2}>Nenhum servidor registrado.</td></tr>}</tbody>
          </table>
        </div>
      </ReviewSection>
    );
  }

  if (sectionKey === "international" || sectionKey === "national") {
    const national = sectionKey === "national";
    const rows = national
      ? data.locations.map((item) => ({ ...item, label: item.name }))
      : data.internationalMembers.map((item) => ({ ...item, label: item.country, detail: undefined }));
    const title = national ? "Localidades Nacionais" : "Localidades Internacionais";
    return (
      <ReviewSection className={national ? "review-section--national" : "review-section--international"} icon={national ? faLocationDot : faGlobe} title={title} count={rows.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={showDecorativeIcons}>
        <div className="review-table-wrap">
          <table className="review-table review-table--locations">
            <thead><tr><th>{detailPage || detailAppearance ? title : national ? "Localidade" : "País"}</th><th>Total</th></tr></thead>
            <tbody>{rows.length ? rows.map((item, index) => (
              <tr key={item.id}>
                <td data-label={detailPage || detailAppearance ? title : national ? "Localidade" : "País"}>
                  <span className="review-location-name">{index + 1}. {item.label}</span>
                  {item.detail && <small>{item.detail}</small>}
                </td>
                <td data-label="Total">{item.count}</td>
              </tr>
            )) : <tr><td colSpan={2}>{national ? "Nenhuma localidade nacional registrada." : "Nenhuma localidade internacional registrada."}</td></tr>}</tbody>
          </table>
        </div>
      </ReviewSection>
    );
  }

  if (sectionKey === "visitors") {
    return (
      <ReviewSection className="review-section--visitors" icon={faUsers} title="Visitantes" count={data.visitors.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={showDecorativeIcons}>
        <div className="review-table-wrap">
          <table className="review-table review-table--visitors">
            <thead><tr><th>Visitante</th><th>Cidade</th><th>Categoria</th><th>Origem</th></tr></thead>
            <tbody>{data.visitors.length ? data.visitors.map((item, index) => (
              <tr key={item.id}>
                <td data-label="Visitante">{index + 1}. {item.label}</td>
                <td data-label="Cidade">{item.city}</td>
                <td data-label="Categoria">{item.category}</td>
                <td data-label="Origem">{item.origin}</td>
              </tr>
            )) : <tr><td colSpan={4}>Nenhum visitante registrado.</td></tr>}</tbody>
          </table>
        </div>
      </ReviewSection>
    );
  }

  if (sectionKey === "admissions") {
    return (
      <ReviewSection className="review-section--admissions" icon={faTicket} title="Ingressos" count={data.admissions.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={showDecorativeIcons}>
        <div className="review-table-wrap">
          <table className="review-table review-table--admissions">
            <thead><tr><th>Ingresso</th><th>Cidade</th><th>Estado</th></tr></thead>
            <tbody>{data.admissions.length ? data.admissions.map((item, index) => (
              <tr key={item.id}>
                <td data-label="Ingresso">{index + 1}. {item.label}</td>
                <td data-label="Cidade">{item.city}</td>
                <td data-label="Estado">{item.state}</td>
              </tr>
            )) : <tr><td colSpan={3}>Nenhum ingresso registrado.</td></tr>}</tbody>
          </table>
        </div>
      </ReviewSection>
    );
  }

  return (
    <ReviewSection className="review-section--achievements" icon={faClock} title="Conquistas" count={data.achievements.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={showDecorativeIcons}>
      <div className="review-table-wrap">
        <table className="review-table review-table--achievements">
          <thead><tr><th>Conquista</th><th>Tempo</th></tr></thead>
          <tbody>{data.achievements.length ? data.achievements.map((item, index) => (
            <tr key={item.id}><td data-label="Conquista">{index + 1}. {item.label}</td><td data-label="Tempo">{item.time}</td></tr>
          )) : <tr><td colSpan={2}>Nenhuma conquista registrada.</td></tr>}</tbody>
        </table>
      </div>
    </ReviewSection>
  );
}

function AtaDetailColumns({ data, desktop }: { data: AtaReviewLayoutData; desktop: boolean }) {
  const layout = buildAtaDetailColumnLayout(data);
  const sections = {
    servers: <AtaDetailSection sectionKey="servers" data={data} desktop={desktop} detailPage detailAppearance={false} />,
    international: <AtaDetailSection sectionKey="international" data={data} desktop={desktop} detailPage detailAppearance={false} />,
    visitors: <AtaDetailSection sectionKey="visitors" data={data} desktop={desktop} detailPage detailAppearance={false} />,
    admissions: <AtaDetailSection sectionKey="admissions" data={data} desktop={desktop} detailPage detailAppearance={false} />,
    achievements: <AtaDetailSection sectionKey="achievements" data={data} desktop={desktop} detailPage detailAppearance={false} />,
  } satisfies Record<AtaDetailSectionKey, ReactNode>;

  return (
    <div className="review-detail-columns">
      <div className="review-detail-column">
        <div className="review-detail-item review-detail-item--national">
          <AtaDetailSection sectionKey="national" data={data} desktop={desktop} detailPage detailAppearance={false} />
        </div>
        {layout.left.map((key) => <div className={`review-detail-item review-detail-item--${key}`} key={key}>{sections[key]}</div>)}
      </div>
      <div className="review-detail-column">
        {layout.right.map((key) => <div className={`review-detail-item review-detail-item--${key}`} key={key}>{sections[key]}</div>)}
      </div>
    </div>
  );
}

export function AtaReviewLayout({
  title,
  description,
  titleId,
  headingLevel = "h2",
  data,
  headerToolbar,
  headerAction,
  headerBadge,
  identification,
  footer,
  className = "",
  detailPage = false,
  detailAppearance = false,
}: {
  title: string;
  description?: string;
  titleId: string;
  headingLevel?: "h1" | "h2";
  data: AtaReviewLayoutData;
  headerToolbar?: ReactNode;
  headerAction?: ReactNode;
  headerBadge?: ReactNode;
  identification?: AtaReviewIdentification;
  footer?: ReactNode;
  className?: string;
  detailPage?: boolean;
  detailAppearance?: boolean;
}) {
  const [desktop, setDesktop] = useState(false);
  const Heading = headingLevel;
  const additionalInformation = data.additionalInformation?.filter(
    (item) => item.label !== "Formato outros",
  ) ?? [];
  const alterationReason = detailPage || detailAppearance
    ? additionalInformation.find((item) => item.label === "Motivo da Alteração")
    : undefined;
  const remainingAdditionalInformation = additionalInformation.filter(
    (item) => item !== alterationReason,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 981px)");
    const updateLayout = () => setDesktop(media.matches);
    updateLayout();
    media.addEventListener("change", updateLayout);
    return () => media.removeEventListener("change", updateLayout);
  }, []);

  return (
    <div className={`ata-review-layout${detailPage ? " ata-review-layout--detail" : ""}${detailAppearance ? " ata-review-layout--detail-appearance" : ""} ${className}`.trim()}>
      <header className="review-layout-header">
        {headerToolbar && (
          <div className="review-layout-header-toolbar">
            {headerToolbar}
          </div>
        )}
        <div className="review-modal-header">
          {!detailPage && !detailAppearance && (
            <span className="review-modal-header-icon" aria-hidden="true">
              <FontAwesomeIcon icon={faFileCircleCheck} />
            </span>
          )}
          <div className={detailPage ? "review-detail-page-title" : undefined}>
            {detailPage && <p className="eyebrow">Ata</p>}
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

      <ReviewBlock enabled={detailPage || detailAppearance} id="review-data-title" title="Dados">
      <dl className="review-grid">
        <div className="review-info-card review-info-card--group">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>}
          <div><dt>Grupo</dt><dd>{data.group}</dd></div>
        </div>
        <div className="review-info-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faCalendarDays} /></span>}
          <div><dt>Data</dt><dd>{formatReviewDate(data.date)}</dd></div>
        </div>
        <div className="review-info-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faClock} /></span>}
          <div><dt>Horário</dt><dd>{data.time}</dd></div>
        </div>
        <div className="review-info-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faFolder} /></span>}
          <div><dt>Tipo</dt><dd>{data.meetingType}</dd></div>
        </div>
        <div className="review-info-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faDesktop} /></span>}
          <div><dt>Plataforma</dt><dd>{data.platform}</dd></div>
        </div>
        <div className="review-info-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faTableCellsLarge} /></span>}
          <div><dt>Formatos</dt><dd>{data.formats}</dd></div>
        </div>
        {alterationReason && (
          <div className="review-info-card review-info-card--reason">
            <div><dt>{alterationReason.label}</dt><dd>{alterationReason.value}</dd></div>
          </div>
        )}
      </dl>

      {remainingAdditionalInformation.length > 0 && (
        <dl className="review-additional-information" aria-label="Informações adicionais da ata">
          {remainingAdditionalInformation.map((item) => (
            <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
          ))}
        </dl>
      )}

      {identification && (
        <section className="review-identification" aria-labelledby="review-identification-title">
          <div className="review-identification-heading">
            {!detailPage && !detailAppearance && <span className="review-section-icon" aria-hidden="true"><FontAwesomeIcon icon={faHashtag} /></span>}
            <h2 id="review-identification-title">Índice personalizado do grupo</h2>
          </div>
          <dl className="review-identification-grid">
            <div><dt>Número da ata</dt><dd>{identification.groupReference}</dd></div>
          </dl>
          {identification.editor}
        </section>
      )}
      </ReviewBlock>

      <ReviewBlock enabled={detailPage || detailAppearance} id="review-consolidated-title" title="Consolidado">
      <dl className="review-metrics" aria-label="Totais da Ata">
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>}
          <div><dt>Servidores</dt><dd>{data.servers.length}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>}
          <div><dt>Membros</dt><dd>{data.membersPresent}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faComments} /></span>}
          <div><dt>Partilhas</dt><dd>{data.shares}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faUsers} /></span>}
          <div><dt>Visitantes</dt><dd>{data.visitors.length}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faTicket} /></span>}
          <div><dt>Ingressos</dt><dd>{data.admissions.length}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faClock} /></span>}
          <div><dt>Conquistas</dt><dd>{data.achievements.length}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faLocationDot} /></span>}
          <div><dt>Cidades</dt><dd>{data.supplementalMetrics?.cities ?? data.locations.length}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faLocationDot} /></span>}
          <div><dt>Estados</dt><dd>{data.supplementalMetrics?.states ?? 0}</dd></div>
        </div>
        <div className="review-info-card review-metric-card">
          {!detailPage && !detailAppearance && <span className="review-info-icon" aria-hidden="true"><FontAwesomeIcon icon={faGlobe} /></span>}
          <div><dt>Outros Países</dt><dd>{data.supplementalMetrics?.otherCountries ?? data.internationalMembers.length}</dd></div>
        </div>
      </dl>
      </ReviewBlock>

      <ReviewBlock enabled={detailPage || detailAppearance} id="review-details-title" title="Detalhamento">
      <div className="review-sections">
        {detailPage ? <AtaDetailColumns data={data} desktop={desktop} /> : (
        <>
        <div className="review-sections-main">
          <div className="review-sections-stack">
            <ReviewSection className="review-section--servers" icon={faUsers} title="Servidores" count={data.servers.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
              {data.servers.length ? (
                <div className="review-table-wrap">
                  <table className="review-table review-table--servers">
                    <thead><tr><th>{detailPage || detailAppearance ? "Servidores" : "Servidor"}</th><th>Função</th></tr></thead>
                    <tbody>{data.servers.map((item, index) => (
                      <tr key={item.id}>
                        <td data-label="Servidores">{index + 1}. {item.name}</td>
                        <td data-label="Função">{item.role || "—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : detailPage || detailAppearance ? (
                <div className="review-table-wrap"><table className="review-table review-table--servers"><thead><tr><th>Servidores</th><th>Função</th></tr></thead><tbody><tr><td colSpan={2}>Nenhum servidor registrado.</td></tr></tbody></table></div>
              ) : <ReviewEmptyState icon={faUsers} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhum servidor registrado.</ReviewEmptyState>}
            </ReviewSection>

            <ReviewSection className="review-section--international" icon={faGlobe} title="Localidades Internacionais" count={data.internationalMembers.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
              {data.internationalMembers.length ? (
                <div className="review-table-wrap">
                  <table className="review-table review-table--locations">
                    <thead><tr><th>{detailPage || detailAppearance ? "Localidades Internacionais" : "País"}</th><th>Total</th></tr></thead>
                    <tbody>{data.internationalMembers.map((item, index) => (
                      <tr key={item.id}>
                        <td data-label="Localidades Internacionais">{index + 1}. {item.country}</td>
                        <td data-label="Total">{item.count}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : detailPage || detailAppearance ? (
                <div className="review-table-wrap"><table className="review-table review-table--locations"><thead><tr><th>Localidades Internacionais</th><th>Total</th></tr></thead><tbody><tr><td colSpan={2}>Nenhuma localidade internacional registrada.</td></tr></tbody></table></div>
              ) : <ReviewEmptyState icon={faGlobe} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhuma localidade internacional registrada.</ReviewEmptyState>}
            </ReviewSection>

            <ReviewSection className="review-section--visitors" icon={faUsers} title="Visitantes" count={data.visitors.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
              {data.visitors.length ? (
                <div className="review-table-wrap">
                  <table className="review-table review-table--visitors"><thead><tr><th>Visitante</th><th>Cidade</th><th>Categoria</th><th>Origem</th></tr></thead>
                    <tbody>{data.visitors.map((item, index) => (
                      <tr key={item.id}>
                        <td data-label="Visitante">{index + 1}. {item.label}</td>
                        <td data-label="Cidade">{item.city}</td>
                        <td data-label="Categoria">{item.category}</td>
                        <td data-label="Origem">{item.origin}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : detailPage || detailAppearance ? (
                <div className="review-table-wrap"><table className="review-table review-table--visitors"><thead><tr><th>Visitante</th><th>Cidade</th><th>Categoria</th><th>Origem</th></tr></thead><tbody><tr><td colSpan={4}>Nenhum visitante registrado.</td></tr></tbody></table></div>
              ) : <ReviewEmptyState icon={faUsers} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhum visitante registrado.</ReviewEmptyState>}
            </ReviewSection>
          </div>

          <ReviewSection className="review-section--national" icon={faLocationDot} title="Localidades Nacionais" count={data.locations.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
            {data.locations.length ? (
              <div className="review-table-wrap">
                <table className="review-table review-table--locations">
                  <thead><tr><th>{detailPage || detailAppearance ? "Localidades Nacionais" : "Localidade"}</th><th>Total</th></tr></thead>
                  <tbody>{data.locations.map((item, index) => (
                    <tr key={item.id}>
                      <td data-label={detailPage || detailAppearance ? "Localidades Nacionais" : "Localidade"}>
                        <span className="review-location-name">{index + 1}. {item.name}</span>
                        {item.detail && <small>{item.detail}</small>}
                      </td>
                      <td data-label="Total">{item.count}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : detailPage || detailAppearance ? (
              <div className="review-table-wrap"><table className="review-table review-table--locations"><thead><tr><th>Localidades Nacionais</th><th>Total</th></tr></thead><tbody><tr><td colSpan={2}>Nenhuma localidade nacional registrada.</td></tr></tbody></table></div>
            ) : <ReviewEmptyState icon={faLocationDot} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhuma localidade nacional registrada.</ReviewEmptyState>}
          </ReviewSection>
        </div>

        <div className="review-sections-bottom">
          <ReviewSection className="review-section--admissions" icon={faTicket} title="Ingressos" count={data.admissions.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
            {data.admissions.length ? (
              <div className="review-table-wrap">
                <table className="review-table review-table--admissions"><thead><tr><th>Ingresso</th><th>Cidade</th><th>Estado</th></tr></thead>
                  <tbody>{data.admissions.map((item, index) => (
                    <tr key={item.id}>
                      <td data-label="Ingresso">{index + 1}. {item.label}</td>
                      <td data-label="Cidade">{item.city}</td>
                      <td data-label="Estado">{item.state}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : detailPage || detailAppearance ? (
              <div className="review-table-wrap"><table className="review-table review-table--admissions"><thead><tr><th>Ingresso</th><th>Cidade</th><th>Estado</th></tr></thead><tbody><tr><td colSpan={3}>Nenhum ingresso registrado.</td></tr></tbody></table></div>
            ) : <ReviewEmptyState icon={faTicket} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhum ingresso registrado.</ReviewEmptyState>}
          </ReviewSection>

          <ReviewSection className="review-section--achievements" icon={faClock} title="Conquistas" count={data.achievements.length} desktop={desktop} detailPage={detailPage} showDecorativeIcons={!detailPage && !detailAppearance}>
            {data.achievements.length ? (
              <div className="review-table-wrap">
                <table className="review-table review-table--achievements"><thead><tr><th>Conquista</th><th>Tempo</th></tr></thead>
                  <tbody>{data.achievements.map((item, index) => (
                    <tr key={item.id}><td data-label="Conquista">{index + 1}. {item.label}</td><td data-label="Tempo">{item.time}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            ) : detailPage || detailAppearance ? (
              <div className="review-table-wrap"><table className="review-table review-table--achievements"><thead><tr><th>Conquista</th><th>Tempo</th></tr></thead><tbody><tr><td colSpan={2}>Nenhuma conquista registrada.</td></tr></tbody></table></div>
            ) : <ReviewEmptyState icon={faClock} showDecorativeIcon={!detailPage && !detailAppearance}>Nenhuma conquista registrada.</ReviewEmptyState>}
          </ReviewSection>
        </div>
        </>
        )}
      </div>
      </ReviewBlock>

      {footer}
    </div>
  );
}
