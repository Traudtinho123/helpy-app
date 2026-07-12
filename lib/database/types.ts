export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EmailStatus = "neu" | "gelesen" | "beantwortet" | "archiviert";

export type Prioritaet = "hoch" | "mittel" | "niedrig";

export type AngebotStatus =
  | "entwurf"
  | "warten_auf_freigabe"
  | "gesendet"
  | "angenommen"
  | "abgelehnt";

export type TerminStatus =
  | "geplant"
  | "bestaetigt"
  | "abgeschlossen"
  | "abgesagt";

/** Freigeschaltete HELPY-Skills (profiles.allowed_skills). */
export type HelpySkillDb =
  | "real-estate"
  | "construction"
  | "consulting-legal"
  | "coiffeur"
  | "gym"
  | "doctor"
  | "cosmetic"
  | "physio"
  | "gastro"
  | "clean"
  | "garden";

export type HelpyCompanyRoleDb = "owner" | "admin" | "member";

export type OAuthProviderDb = "google" | "microsoft";

export type OAuthConnectionStatusDb = "active" | "error" | "revoked";

export type VoiceCallStatusDb =
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "missed";

export type WhatsappMessageStatusDb =
  | "neu"
  | "in_bearbeitung"
  | "erledigt"
  | "archiviert";

export type MailProvider = "gmail" | "outlook";

export type CompletedVorgangDbStatus =
  | "neu"
  | "von_helpy_vorbereitet"
  | "warten_auf_pruefung"
  | "warten_auf_antwort"
  | "erledigt"
  | "neue_antwort_eingegangen"
  // Legacy display labels (local cache / older rows)
  | "Neu"
  | "Von HELPY vorbereitet"
  | "Warten auf Prüfung"
  | "Warten auf Antwort"
  | "Erledigt"
  | "Neue Antwort eingegangen";

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          registration_status: string;
          requested_skill: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          registration_status?: string;
          requested_skill?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          registration_status?: string;
          requested_skill?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      company_skills: {
        Row: {
          id: string;
          company_id: string;
          skill: string;
          activated_at: string;
          activated_by: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          company_id: string;
          skill: string;
          activated_at?: string;
          activated_by?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          company_id?: string;
          skill?: string;
          activated_at?: string;
          activated_by?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      team_invites: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          full_name: string;
          role: string;
          status: string;
          invited_by: string | null;
          invited_at: string;
          accepted_at: string | null;
          accepted_user_id: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          full_name: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          status?: string;
          invited_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          accepted_user_id?: string | null;
        };
        Relationships: [];
      };
      company_knowledge: {
        Row: {
          company_id: string;
          data: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          company_id: string;
          data?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string;
          data?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_knowledge_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_connections: {
        Row: {
          id: string;
          company_id: string;
          connected_by_user_id: string;
          provider: OAuthProviderDb;
          account_email: string;
          access_token_encrypted: string;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          scopes: string[];
          status: OAuthConnectionStatusDb;
          last_sync_at: string | null;
          last_error: string | null;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          connected_by_user_id: string;
          provider: OAuthProviderDb;
          account_email: string;
          access_token_encrypted: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: OAuthConnectionStatusDb;
          last_sync_at?: string | null;
          last_error?: string | null;
          connected_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          connected_by_user_id?: string;
          provider?: OAuthProviderDb;
          account_email?: string;
          access_token_encrypted?: string;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: OAuthConnectionStatusDb;
          last_sync_at?: string | null;
          last_error?: string | null;
          connected_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_connections_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_settings: {
        Row: {
          company_id: string;
          enabled: boolean;
          provider: string;
          phone_number: string | null;
          greeting_text: string;
          disclosure_text: string;
          business_hours: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          enabled?: boolean;
          provider?: string;
          phone_number?: string | null;
          greeting_text?: string;
          disclosure_text?: string;
          business_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          enabled?: boolean;
          provider?: string;
          phone_number?: string | null;
          greeting_text?: string;
          disclosure_text?: string;
          business_hours?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_calls: {
        Row: {
          id: string;
          company_id: string;
          external_call_id: string | null;
          caller_phone: string | null;
          caller_name: string | null;
          status: VoiceCallStatusDb;
          duration_seconds: number | null;
          transcript: string | null;
          transcript_turns: Json;
          summary: string | null;
          intent: string | null;
          vorgang_id: string | null;
          assistant_reply: string | null;
          processed_payload: Json | null;
          client_ack_at: string | null;
          empty_result_count: number;
          call_classification: string | null;
          termin_datum: string | null;
          termin_uhrzeit: string | null;
          termin_objekt: string | null;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          external_call_id?: string | null;
          caller_phone?: string | null;
          caller_name?: string | null;
          status?: VoiceCallStatusDb;
          duration_seconds?: number | null;
          transcript?: string | null;
          transcript_turns?: Json;
          summary?: string | null;
          intent?: string | null;
          vorgang_id?: string | null;
          assistant_reply?: string | null;
          processed_payload?: Json | null;
          client_ack_at?: string | null;
          empty_result_count?: number;
          call_classification?: string | null;
          termin_datum?: string | null;
          termin_uhrzeit?: string | null;
          termin_objekt?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          external_call_id?: string | null;
          caller_phone?: string | null;
          caller_name?: string | null;
          status?: VoiceCallStatusDb;
          duration_seconds?: number | null;
          transcript?: string | null;
          transcript_turns?: Json;
          summary?: string | null;
          intent?: string | null;
          vorgang_id?: string | null;
          assistant_reply?: string | null;
          processed_payload?: Json | null;
          client_ack_at?: string | null;
          empty_result_count?: number;
          call_classification?: string | null;
          termin_datum?: string | null;
          termin_uhrzeit?: string | null;
          termin_objekt?: string | null;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_calls_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vorgaenge: {
        Row: {
          id: string;
          company_id: string;
          source: string;
          titel: string;
          inhalt: string;
          prioritaet: string;
          status: string;
          kunden_id: string | null;
          objekt_id: string | null;
          gmail_message_id: string | null;
          gmail_thread_id: string | null;
          voice_call_id: string | null;
          anrufer_nummer: string | null;
          termin_datum: string | null;
          termin_uhrzeit: string | null;
          whatsapp_message_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          source: string;
          titel: string;
          inhalt: string;
          prioritaet?: string;
          status?: string;
          kunden_id?: string | null;
          objekt_id?: string | null;
          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;
          voice_call_id?: string | null;
          anrufer_nummer?: string | null;
          termin_datum?: string | null;
          termin_uhrzeit?: string | null;
          whatsapp_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          source?: string;
          titel?: string;
          inhalt?: string;
          prioritaet?: string;
          status?: string;
          kunden_id?: string | null;
          objekt_id?: string | null;
          gmail_message_id?: string | null;
          gmail_thread_id?: string | null;
          voice_call_id?: string | null;
          anrufer_nummer?: string | null;
          termin_datum?: string | null;
          termin_uhrzeit?: string | null;
          whatsapp_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vorgaenge_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_standard_responses: {
        Row: {
          id: string;
          company_id: string;
          trigger_text: string;
          response_text: string;
          category: string;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          trigger_text: string;
          response_text: string;
          category?: string;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          trigger_text?: string;
          response_text?: string;
          category?: string;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_standard_responses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          firma: string | null;
          vorname: string | null;
          nachname: string | null;
          telefon: string | null;
          sprache: string;
          logo_url: string | null;
          erstellt_am: string;
          allowed_skills: HelpySkillDb[];
          company_id: string | null;
          role: HelpyCompanyRoleDb;
          is_platform_operator: boolean;
          is_super_admin: boolean;
          weekly_report_enabled: boolean;
          weekly_report_last_sent_week: string | null;
        };
        Insert: {
          id: string;
          firma?: string | null;
          vorname?: string | null;
          nachname?: string | null;
          telefon?: string | null;
          sprache?: string;
          logo_url?: string | null;
          erstellt_am?: string;
          allowed_skills?: HelpySkillDb[];
          company_id?: string | null;
          role?: HelpyCompanyRoleDb;
          is_platform_operator?: boolean;
          is_super_admin?: boolean;
          weekly_report_enabled?: boolean;
          weekly_report_last_sent_week?: string | null;
        };
        Update: {
          id?: string;
          firma?: string | null;
          vorname?: string | null;
          nachname?: string | null;
          telefon?: string | null;
          sprache?: string;
          logo_url?: string | null;
          erstellt_am?: string;
          allowed_skills?: HelpySkillDb[];
          company_id?: string | null;
          role?: HelpyCompanyRoleDb;
          is_platform_operator?: boolean;
          is_super_admin?: boolean;
          weekly_report_enabled?: boolean;
          weekly_report_last_sent_week?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      kunden: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          firmenname: string;
          ansprechpartner: string | null;
          email: string | null;
          telefon: string | null;
          adresse: string | null;
          ust_id: string | null;
          notizen: string | null;
          status: "interessent" | "aktiv" | "bestandskunde";
          erstellt_am: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          firmenname: string;
          ansprechpartner?: string | null;
          email?: string | null;
          telefon?: string | null;
          adresse?: string | null;
          ust_id?: string | null;
          notizen?: string | null;
          status?: "interessent" | "aktiv" | "bestandskunde";
          erstellt_am?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          firmenname?: string;
          ansprechpartner?: string | null;
          email?: string | null;
          telefon?: string | null;
          adresse?: string | null;
          ust_id?: string | null;
          notizen?: string | null;
          status?: "interessent" | "aktiv" | "bestandskunde";
          erstellt_am?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kunden_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kunden_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          kunde_id: string | null;
          betreff: string;
          absender: string;
          empfaenger: string | null;
          inhalt: string | null;
          zusammenfassung: string | null;
          status: EmailStatus;
          prioritaet: Prioritaet;
          antwort: string | null;
          erstellt_am: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          kunde_id?: string | null;
          betreff: string;
          absender: string;
          empfaenger?: string | null;
          inhalt?: string | null;
          zusammenfassung?: string | null;
          status?: EmailStatus;
          prioritaet?: Prioritaet;
          antwort?: string | null;
          erstellt_am?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          kunde_id?: string | null;
          betreff?: string;
          absender?: string;
          empfaenger?: string | null;
          inhalt?: string | null;
          zusammenfassung?: string | null;
          status?: EmailStatus;
          prioritaet?: Prioritaet;
          antwort?: string | null;
          erstellt_am?: string;
        };
        Relationships: [
          {
            foreignKeyName: "emails_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emails_kunde_id_fkey";
            columns: ["kunde_id"];
            isOneToOne: false;
            referencedRelation: "kunden";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "emails_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      angebote: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          kunde_id: string | null;
          angebot_nr: string;
          status: AngebotStatus;
          netto: number | null;
          brutto: number | null;
          pdf_url: string | null;
          erstellt_am: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          kunde_id?: string | null;
          angebot_nr: string;
          status?: AngebotStatus;
          netto?: number | null;
          brutto?: number | null;
          pdf_url?: string | null;
          erstellt_am?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          kunde_id?: string | null;
          angebot_nr?: string;
          status?: AngebotStatus;
          netto?: number | null;
          brutto?: number | null;
          pdf_url?: string | null;
          erstellt_am?: string;
        };
        Relationships: [
          {
            foreignKeyName: "angebote_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "angebote_kunde_id_fkey";
            columns: ["kunde_id"];
            isOneToOne: false;
            referencedRelation: "kunden";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "angebote_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      angebotspositionen: {
        Row: {
          id: string;
          angebot_id: string;
          bezeichnung: string;
          menge: number;
          einzelpreis: number;
          mwst: number;
        };
        Insert: {
          id?: string;
          angebot_id: string;
          bezeichnung: string;
          menge?: number;
          einzelpreis: number;
          mwst?: number;
        };
        Update: {
          id?: string;
          angebot_id?: string;
          bezeichnung?: string;
          menge?: number;
          einzelpreis?: number;
          mwst?: number;
        };
        Relationships: [
          {
            foreignKeyName: "angebotspositionen_angebot_id_fkey";
            columns: ["angebot_id"];
            isOneToOne: false;
            referencedRelation: "angebote";
            referencedColumns: ["id"];
          },
        ];
      };
      termine: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          kunde_id: string | null;
          titel: string;
          ort: string | null;
          start: string;
          ende: string | null;
          status: TerminStatus;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          kunde_id?: string | null;
          titel: string;
          ort?: string | null;
          start: string;
          ende?: string | null;
          status?: TerminStatus;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          kunde_id?: string | null;
          titel?: string;
          ort?: string | null;
          start?: string;
          ende?: string | null;
          status?: TerminStatus;
        };
        Relationships: [
          {
            foreignKeyName: "termine_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "termine_kunde_id_fkey";
            columns: ["kunde_id"];
            isOneToOne: false;
            referencedRelation: "kunden";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "termine_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          email_id: string | null;
          beschreibung: string;
          erledigt: boolean;
          prioritaet: Prioritaet;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          email_id?: string | null;
          beschreibung: string;
          erledigt?: boolean;
          prioritaet?: Prioritaet;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          email_id?: string | null;
          beschreibung?: string;
          erledigt?: boolean;
          prioritaet?: Prioritaet;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_email_id_fkey";
            columns: ["email_id"];
            isOneToOne: false;
            referencedRelation: "emails";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      vorgang_events: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          provider: MailProvider;
          provider_thread_id: string;
          vorgang_id: string;
          typ: string;
          intent: string | null;
          intent_label: string | null;
          kunde_name: string | null;
          prioritaet: string | null;
          is_appointment_request: boolean;
          is_new_inquiry: boolean;
          received_at: string;
          erkannt_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          provider: MailProvider;
          provider_thread_id: string;
          vorgang_id: string;
          typ: string;
          intent?: string | null;
          intent_label?: string | null;
          kunde_name?: string | null;
          prioritaet?: string | null;
          is_appointment_request?: boolean;
          is_new_inquiry?: boolean;
          received_at: string;
          erkannt_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          provider?: MailProvider;
          provider_thread_id?: string;
          vorgang_id?: string;
          typ?: string;
          intent?: string | null;
          intent_label?: string | null;
          kunde_name?: string | null;
          prioritaet?: string | null;
          is_appointment_request?: boolean;
          is_new_inquiry?: boolean;
          received_at?: string;
          erkannt_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vorgang_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vorgang_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_connections: {
        Row: {
          id: string;
          company_id: string;
          phone_number_id: string;
          display_number: string | null;
          waba_id: string | null;
          is_active: boolean;
          connected_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          phone_number_id: string;
          display_number?: string | null;
          waba_id?: string | null;
          is_active?: boolean;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          phone_number_id?: string;
          display_number?: string | null;
          waba_id?: string | null;
          is_active?: boolean;
          connected_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          company_id: string;
          message_id: string;
          from_number: string;
          from_name: string | null;
          body: string;
          message_type: string;
          status: WhatsappMessageStatusDb;
          intent_type: string | null;
          intent_label: string | null;
          priority: string | null;
          summary: string | null;
          recommended_action: string | null;
          customer_id: string | null;
          received_at: string;
          classified_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          message_id: string;
          from_number: string;
          from_name?: string | null;
          body?: string;
          message_type?: string;
          status?: WhatsappMessageStatusDb;
          intent_type?: string | null;
          intent_label?: string | null;
          priority?: string | null;
          summary?: string | null;
          recommended_action?: string | null;
          customer_id?: string | null;
          received_at: string;
          classified_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          message_id?: string;
          from_number?: string;
          from_name?: string | null;
          body?: string;
          message_type?: string;
          status?: WhatsappMessageStatusDb;
          intent_type?: string | null;
          intent_label?: string | null;
          priority?: string | null;
          summary?: string | null;
          recommended_action?: string | null;
          customer_id?: string | null;
          received_at?: string;
          classified_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "kunden";
            referencedColumns: ["id"];
          },
        ];
      };
      completed_vorgaenge: {
        Row: {
          id: string;
          user_id: string | null;
          company_id: string;
          provider: MailProvider;
          provider_thread_id: string;
          provider_message_id: string | null;
          case_id: string | null;
          vorgang_id: string | null;
          status: string;
          completed_at: string;
          completed_by: string | null;
          last_known_incoming_message_at: string | null;
          last_known_outgoing_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_id?: string;
          provider: MailProvider;
          provider_thread_id: string;
          provider_message_id?: string | null;
          case_id?: string | null;
          vorgang_id?: string | null;
          status?: string;
          completed_at?: string;
          completed_by?: string | null;
          last_known_incoming_message_at?: string | null;
          last_known_outgoing_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          company_id?: string;
          provider?: MailProvider;
          provider_thread_id?: string;
          provider_message_id?: string | null;
          case_id?: string | null;
          vorgang_id?: string | null;
          status?: string;
          completed_at?: string;
          completed_by?: string | null;
          last_known_incoming_message_at?: string | null;
          last_known_outgoing_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "completed_vorgaenge_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      email_status: EmailStatus;
      prioritaet: Prioritaet;
      angebot_status: AngebotStatus;
      termin_status: TerminStatus;
      helpy_skill: HelpySkillDb;
      oauth_provider: OAuthProviderDb;
      oauth_connection_status: OAuthConnectionStatusDb;
      voice_call_status: VoiceCallStatusDb;
      whatsapp_message_status: WhatsappMessageStatusDb;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;
export type Company = Tables<"companies">;
export type CompanyInsert = TablesInsert<"companies">;
export type CompanyUpdate = TablesUpdate<"companies">;
export type CompanyKnowledgeRow = Tables<"company_knowledge">;
export type CompanyKnowledgeInsert = TablesInsert<"company_knowledge">;
export type CompanyKnowledgeUpdate = TablesUpdate<"company_knowledge">;
export type OAuthConnection = Tables<"oauth_connections">;
export type OAuthConnectionInsert = TablesInsert<"oauth_connections">;
export type OAuthConnectionUpdate = TablesUpdate<"oauth_connections">;
export type VoiceSettingsRow = Tables<"voice_settings">;
export type VoiceSettingsInsert = TablesInsert<"voice_settings">;
export type VoiceSettingsUpdate = TablesUpdate<"voice_settings">;
export type VoiceCallRow = Tables<"voice_calls">;
export type VoiceCallInsert = TablesInsert<"voice_calls">;
export type VoiceCallUpdate = TablesUpdate<"voice_calls">;
export type VorgangRow = Tables<"vorgaenge">;
export type VorgangInsert = TablesInsert<"vorgaenge">;
export type VorgangUpdate = TablesUpdate<"vorgaenge">;
export type VoiceStandardResponseRow = Tables<"voice_standard_responses">;
export type VoiceStandardResponseInsert = TablesInsert<"voice_standard_responses">;
export type VoiceStandardResponseUpdate = TablesUpdate<"voice_standard_responses">;
export type WhatsappConnectionRow = Tables<"whatsapp_connections">;
export type WhatsappConnectionInsert = TablesInsert<"whatsapp_connections">;
export type WhatsappConnectionUpdate = TablesUpdate<"whatsapp_connections">;
export type WhatsappMessageRow = Tables<"whatsapp_messages">;
export type WhatsappMessageInsert = TablesInsert<"whatsapp_messages">;
export type WhatsappMessageUpdate = TablesUpdate<"whatsapp_messages">;

export type Kunde = Tables<"kunden">;
export type KundeInsert = TablesInsert<"kunden">;
export type KundeUpdate = TablesUpdate<"kunden">;

export type Email = Tables<"emails">;
export type EmailInsert = TablesInsert<"emails">;
export type EmailUpdate = TablesUpdate<"emails">;

export type Angebot = Tables<"angebote">;
export type AngebotInsert = TablesInsert<"angebote">;
export type AngebotUpdate = TablesUpdate<"angebote">;

export type Angebotsposition = Tables<"angebotspositionen">;
export type AngebotspositionInsert = TablesInsert<"angebotspositionen">;
export type AngebotspositionUpdate = TablesUpdate<"angebotspositionen">;

export type Termin = Tables<"termine">;
export type TerminInsert = TablesInsert<"termine">;
export type TerminUpdate = TablesUpdate<"termine">;

export type Task = Tables<"tasks">;
export type TaskInsert = TablesInsert<"tasks">;
export type TaskUpdate = TablesUpdate<"tasks">;

export type VorgangEventRow = Tables<"vorgang_events">;
export type VorgangEventInsert = TablesInsert<"vorgang_events">;
export type CompletedVorgangRow = Tables<"completed_vorgaenge">;
export type CompletedVorgangInsert = TablesInsert<"completed_vorgaenge">;
export type CompletedVorgangUpdate = TablesUpdate<"completed_vorgaenge">;

/** Angebot inkl. Positionen — häufiges Lese-Modell */
export type AngebotMitPositionen = Angebot & {
  angebotspositionen: Angebotsposition[];
};

/** E-Mail inkl. verknüpfter Aufgaben */
export type EmailMitTasks = Email & {
  tasks: Task[];
};

/** Kunde mit verknüpften Entitäten — für Detailansichten */
export type KundeMitBeziehungen = Kunde & {
  emails: Email[];
  angebote: Angebot[];
  termine: Termin[];
};

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  neu: "Neu",
  gelesen: "Gelesen",
  beantwortet: "Beantwortet",
  archiviert: "Archiviert",
};

export const PRIORITAET_LABELS: Record<Prioritaet, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export const ANGEBOT_STATUS_LABELS: Record<AngebotStatus, string> = {
  entwurf: "Entwurf",
  warten_auf_freigabe: "Warten auf Freigabe",
  gesendet: "Gesendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

export const TERMIN_STATUS_LABELS: Record<TerminStatus, string> = {
  geplant: "Geplant",
  bestaetigt: "Bestätigt",
  abgeschlossen: "Abgeschlossen",
  abgesagt: "Abgesagt",
};
