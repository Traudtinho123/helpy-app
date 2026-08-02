const CONTACT_EMAIL = "viktortraudt0@gmail.com";

export function DatenschutzContent() {
  return (
    <>
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung im Sinne der
          Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p>
          <strong>HELPY</strong>
          <br />
          E-Mail:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>

      <section>
        <h2>2. Überblick</h2>
        <p>
          HELPY ist eine cloudbasierte SaaS-Anwendung („Software as a Service“),
          die Unternehmen bei der Organisation von Kommunikation, Vorgängen und
          Büroprozessen unterstützt. Dabei können insbesondere E-Mail-Daten aus
          verbundenen Gmail-Konten verarbeitet werden.
        </p>
        <p>
          Wir verarbeiten personenbezogene Daten nur, soweit dies zur
          Bereitstellung der Plattform, zur Vertragserfüllung oder auf Grundlage
          einer gesetzlichen Erlaubnis erforderlich ist.
        </p>
      </section>

      <section>
        <h2>3. Welche Daten wir verarbeiten</h2>
        <p>Je nach Nutzung der Plattform können folgende Daten verarbeitet werden:</p>
        <ul>
          <li>
            <strong>Kontodaten:</strong> Name, E-Mail-Adresse, Passwort (verschlüsselt),
            Unternehmensangaben, Teamzugehörigkeit
          </li>
          <li>
            <strong>Nutzungsdaten:</strong> Login-Zeitpunkte, Einstellungen,
            Protokolldaten zur Fehlerbehebung und Systemsicherheit
          </li>
          <li>
            <strong>Inhaltsdaten:</strong> Vorgänge, Kunden-/Kontaktdaten,
            Dokumente, Termine und sonstige vom Nutzer in HELPY erfasste
            Informationen
          </li>
          <li>
            <strong>Gmail-Daten (bei Verbindung):</strong> E-Mail-Metadaten
            (Absender, Empfänger, Betreff, Datum), E-Mail-Inhalte, Anhänge soweit
            für die Funktion erforderlich, sowie OAuth-Zugangstoken zur
            Gmail-Anbindung
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Gmail-Integration und Google OAuth</h2>
        <p>
          Wenn Sie Ihr Gmail-Konto mit HELPY verbinden, erfolgt die Authentifizierung
          über Google OAuth. HELPY erhält dabei nur die von Ihnen autorisierten
          Zugriffsrechte (Scopes).
        </p>
        <p>Die Gmail-Anbindung dient insbesondere dazu:</p>
        <ul>
          <li>E-Mails zu synchronisieren und in Vorgängen darzustellen</li>
          <li>Anfragen zu erkennen und Arbeitsvorschläge zu erstellen</li>
          <li>Antworten im Namen des Nutzers vorzubereiten oder zu senden, sofern Sie dies auslösen</li>
        </ul>
        <p>
          Google verarbeitet Daten im Rahmen der OAuth-Anmeldung als eigenständiger
          Verantwortlicher. Informationen finden Sie in der{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Datenschutzerklärung von Google
          </a>
          .
        </p>
        <p>
          Sie können die Gmail-Verbindung jederzeit in HELPY oder in Ihrem
          Google-Konto widerrufen.
        </p>
      </section>

      <section>
        <h2>5. Zwecke der Verarbeitung</h2>
        <ul>
          <li>Bereitstellung und Betrieb der HELPY-Plattform</li>
          <li>Registrierung, Authentifizierung und Kontoverwaltung</li>
          <li>Synchronisation und Verarbeitung von Gmail-Daten auf Ihre Anweisung</li>
          <li>KI-gestützte Analyse und Assistenzfunktionen im Rahmen der App-Funktionen</li>
          <li>Support, Sicherheit, Fehleranalyse und Missbrauchsprävention</li>
          <li>Erfüllung gesetzlicher Pflichten</li>
        </ul>
      </section>

      <section>
        <h2>6. Rechtsgrundlagen</h2>
        <p>Die Verarbeitung erfolgt auf folgenden Rechtsgrundlagen:</p>
        <ul>
          <li>
            <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung und
            vorvertragliche Maßnahmen
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung, z. B. bei
            Gmail-Verbindung oder optionalen Funktionen
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — berechtigtes Interesse
            an sicherem Betrieb, Produktverbesserung und Betrugsprävention
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — gesetzliche
            Verpflichtungen
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Speicherdauer</h2>
        <p>
          Personenbezogene Daten werden nur so lange gespeichert, wie es für die
          genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen
          bestehen.
        </p>
        <p>
          Nach Beendigung des Nutzerkontos werden personenbezogene Daten gelöscht
          oder anonymisiert, sofern keine gesetzlichen Aufbewahrungspflichten
          entgegenstehen. Gmail-Zugangstoken werden bei Trennung der Verbindung
          entfernt.
        </p>
      </section>

      <section>
        <h2>8. Empfänger und Auftragsverarbeiter</h2>
        <p>
          Zur Bereitstellung der Dienste setzen wir sorgfältig ausgewählte
          Dienstleister ein, die personenbezogene Daten nur nach unseren Weisungen
          und auf Basis von Auftragsverarbeitungsverträgen verarbeiten, soweit
          erforderlich.
        </p>
        <p>Dies können insbesondere sein:</p>
        <ul>
          <li>Hosting- und Datenbankanbieter (z. B. Supabase)</li>
          <li>Google (Gmail API / OAuth)</li>
          <li>KI-Dienstleister zur Textverarbeitung, sofern Funktionen genutzt werden</li>
        </ul>
        <p>
          Eine Übermittlung in Drittländer erfolgt nur, wenn geeignete Garantien
          gemäß Art. 44 ff. DSGVO bestehen (z. B. Standardvertragsklauseln).
        </p>
      </section>

      <section>
        <h2>9. Cookies und lokale Speicherung</h2>
        <p>
          HELPY verwendet technisch notwendige Cookies bzw. vergleichbare
          Technologien für Anmeldung, Sitzungsverwaltung und Sicherheit. Optional
          können Einstellungen lokal im Browser gespeichert werden.
        </p>
        <p>
          Nicht erforderliche Tracking-Cookies setzen wir nicht ohne Ihre
          Einwilligung ein.
        </p>
      </section>

      <section>
        <h2>10. Sicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Maßnahmen zum
          Schutz Ihrer Daten, insbesondere Verschlüsselung bei der Übertragung
          (TLS), Zugriffskontrollen, rollenbasierte Berechtigungen und
          Protokollierung sicherheitsrelevanter Ereignisse.
        </p>
      </section>

      <section>
        <h2>11. Ihre Rechte</h2>
        <p>Sie haben gegenüber HELPY insbesondere folgende Rechte:</p>
        <ul>
          <li>Auskunft (Art. 15 DSGVO)</li>
          <li>Berichtigung (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch (Art. 21 DSGVO)</li>
          <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
        <p>
          Zur Ausübung Ihrer Rechte wenden Sie sich an{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          Sie haben zudem das Recht, sich bei einer Datenschutzaufsichtsbehörde
          zu beschweren.
        </p>
      </section>

      <section>
        <h2>12. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, wenn sich Rechtslage,
          Funktionen oder eingesetzte Dienstleister ändern. Die jeweils aktuelle
          Fassung ist unter <strong>/datenschutz</strong> abrufbar.
        </p>
      </section>

      <section>
        <h2>13. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz erreichen Sie uns unter:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </>
  );
}
