"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import appIcon from "./icon.png";

export function AppShell({
  children,
  homeHref,
  homeLabel,
  navigation,
  navigationLabel,
  variant,
}: {
  children: ReactNode;
  homeHref: string;
  homeLabel: string;
  navigation: ReactNode;
  navigationLabel: string;
  variant: "admin" | "responsavel";
}) {
  const [open, setOpen] = useState(false);
  const navigationId = useId();
  const shellNavigationRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverCloseTimer = useRef<number | null>(null);

  function clearHoverCloseTimer() {
    if (hoverCloseTimer.current === null) return;
    window.clearTimeout(hoverCloseTimer.current);
    hoverCloseTimer.current = null;
  }

  function scheduleHoverClose() {
    clearHoverCloseTimer();
    hoverCloseTimer.current = window.setTimeout(() => {
      hoverCloseTimer.current = null;
      setOpen(false);
    }, 1000);
  }

  useEffect(() => {
    return () => {
      if (hoverCloseTimer.current !== null) {
        window.clearTimeout(hoverCloseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeOnPointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !shellNavigationRef.current?.contains(target)
      ) {
        clearHoverCloseTimer();
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      clearHoverCloseTimer();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const closeResponsiveMenu = () => {
      clearHoverCloseTimer();
      setOpen(false);
    };
    desktop.addEventListener("change", closeResponsiveMenu);
    return () => desktop.removeEventListener("change", closeResponsiveMenu);
  }, []);

  return (
    <main className={`app-layout ${variant}-layout`}>
      <aside
        ref={shellNavigationRef}
        className={`app-sidebar ${variant}-sidebar`}
        aria-label={navigationLabel}
        onPointerEnter={(event) => {
          if (
            event.pointerType === "mouse" &&
            window.matchMedia("(max-width: 980px)").matches
          ) {
            clearHoverCloseTimer();
            setOpen(true);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse") return;
          if (window.matchMedia("(max-width: 980px)").matches) scheduleHoverClose();
        }}
      >
        <div className="app-navigation-header">
          <Link
            className={`app-brand ${variant}-brand`}
            href={homeHref}
            aria-label={homeLabel}
            title={homeLabel}
            onClick={() => setOpen(false)}
          >
            <Image
              className="app-brand-icon"
              src={appIcon}
              alt=""
              width={32}
              height={32}
              priority
            />
            <span>GS Mapeamento</span>
          </Link>

          <button
            ref={triggerRef}
            type="button"
            className="app-menu-trigger"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls={navigationId}
            title={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => {
              clearHoverCloseTimer();
              setOpen((current) => !current);
            }}
          >
            <FontAwesomeIcon icon={open ? faXmark : faBars} />
          </button>
        </div>

        <nav
          id={navigationId}
          className={`app-nav ${variant}-nav`}
          aria-label={navigationLabel}
          data-open={open ? "true" : "false"}
          onClick={(event) => {
            const target = event.target;
            if (
              target instanceof Element &&
              target.closest("a, button[type='submit']")
            ) {
              clearHoverCloseTimer();
              setOpen(false);
            }
          }}
          onPointerEnter={(event) => {
            if (event.pointerType !== "mouse") return;
            clearHoverCloseTimer();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType !== "mouse") return;
            if (window.matchMedia("(max-width: 980px)").matches) {
              scheduleHoverClose();
            }
          }}
        >
          {navigation}
        </nav>
      </aside>

      <div className={`app-main ${variant}-main`}>{children}</div>
    </main>
  );
}
