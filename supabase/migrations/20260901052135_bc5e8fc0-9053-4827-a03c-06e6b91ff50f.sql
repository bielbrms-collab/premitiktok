ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS reply_to text;

UPDATE public.email_templates SET
  from_name = 'Support Financier',
  from_email = 'support@notify.suportetikt0k.shop',
  reply_to = 'support@notify.suportetikt0k.shop',
  subject = 'Confirmation de votre commande {{commande}}',
  heading = 'Votre commande est confirmée',
  intro = 'Bonjour {{nom}}, votre paiement a bien été reçu.',
  body_text = 'Votre accès est disponible dès maintenant. Utilisez le bouton ci-dessous pour ouvrir le suivi de votre demande.

Conservez cet e-mail : il contient le lien d''accès à votre commande.',
  button_label = 'Accéder au suivi de ma demande',
  fallback_note = 'Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :',
  signature = 'Équipe Support
support@notify.suportetikt0k.shop'
WHERE from_email NOT LIKE '%@notify.suportetikt0k.shop' OR reply_to IS NULL;