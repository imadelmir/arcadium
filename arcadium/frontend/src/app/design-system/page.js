"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  Input,
  Select,
  Tabs,
  Avatar,
  Spinner,
} from "@/components";
import styles from "./design-system.module.css";

// Living style guide for Arcadium (M5 - T2).
// A single page that shows every base component in its main states, so the
// team has one reference while building the real pages. Not part of the app
// flow; it can be deleted once the design system is stable.

// Tiny inline icons just for this demo. In the real pages we can swap to an
// icon library (e.g. lucide-react) if we want a full set.
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  </svg>
);

const FILTER_TABS = [
  { value: "all", label: "Tutti" },
  { value: "never", label: "Mai giocato" },
  { value: "playing", label: "In corso" },
  { value: "finished", label: "Finito" },
  { value: "abandoned", label: "Abbandonato" },
];

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.row}>{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  const [filter, setFilter] = useState("all");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.brand}>ARCADIUM</p>
        <h1 className={styles.title}>Design system</h1>
        <p className={styles.subtitle}>
          Componenti base riutilizzabili (M5 - T2). Filtro attivo:{" "}
          <strong>{FILTER_TABS.find((t) => t.value === filter)?.label}</strong>
        </p>
      </header>

      <Section title="Buttons">
        <Button>Primario</Button>
        <Button variant="secondary">Secondario</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button iconLeft={<PlusIcon />}>Con icona</Button>
        <Button size="sm">Small</Button>
        <Button disabled>Disabilitato</Button>
      </Section>

      <Section title="Badge & stati gioco">
        <Badge>Open World</Badge>
        <Badge tone="primary" dot>
          Collegato
        </Badge>
        <Badge tone="success">-50%</Badge>
        <Badge tone="warning">Beta</Badge>
        <Badge tone="danger">Esaurito</Badge>
        <span className={styles.spacer} />
        <StatusBadge status="never" />
        <StatusBadge status="playing" />
        <StatusBadge status="finished" />
        <StatusBadge status="abandoned" />
      </Section>

      <Section title="Tabs (filtri)">
        <Tabs items={FILTER_TABS} value={filter} onChange={setFilter} />
      </Section>

      <Section title="Form">
        <div className={styles.formCol}>
          <Input
            label="Cerca"
            iconLeft={<SearchIcon />}
            placeholder="Cerca giochi, generi, sviluppatori..."
          />
          <Input label="Email" type="email" placeholder="tu@email.com" hint="Useremo questa email per accedere." />
          <Input
            label="Password"
            type="password"
            defaultValue="sbagliata"
            error="Email o password non corretti. Riprova."
          />
          <Select label="Ordina" defaultValue="pop">
            <option value="pop">Popolarita</option>
            <option value="price">Prezzo</option>
            <option value="name">Nome</option>
          </Select>
        </div>
      </Section>

      <Section title="Avatar">
        <Avatar name="Luca Rossi" size="sm" />
        <Avatar name="Luca Rossi" />
        <Avatar name="Giulia Bianchi Verdi" size="lg" />
      </Section>

      <Section title="Card & spinner">
        <Card>
          <strong>Card semplice</strong>
          <p className={styles.cardText}>Il contenitore scuro usato per righe e sezioni.</p>
        </Card>
        <Card hoverable>
          <strong>Card hoverable</strong>
          <p className={styles.cardText}>Passa il mouse sopra: si solleva, come le card dei giochi.</p>
        </Card>
        <Card>
          <Spinner label="Caricamento catalogo..." /> <span className={styles.cardText}>Caricamento...</span>
        </Card>
      </Section>
    </main>
  );
}
