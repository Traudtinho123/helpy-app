-- Status "zu_archivieren" für automatisch aussortierte Spam/Newsletter/System-Mails

ALTER TABLE public.vorgaenge
DROP CONSTRAINT IF EXISTS vorgaenge_status_check;

ALTER TABLE public.vorgaenge
ADD CONSTRAINT vorgaenge_status_check
CHECK (status IN (
  'neu',
  'in_bearbeitung',
  'warten_auf_antwort',
  'erledigt',
  'archiviert',
  'zu_archivieren'
));

ALTER TABLE public.vorgaenge
ADD COLUMN IF NOT EXISTS archiv_kategorie TEXT;

COMMENT ON COLUMN public.vorgaenge.archiv_kategorie IS
  'newsletter | werbung | system | spam | benachrichtigung — nur bei status zu_archivieren';
