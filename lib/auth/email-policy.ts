const defaultAllowedEmailDomains = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.com.br",
  "ymail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "zoho.com",
  "zohomail.com",
  "aol.com",
  "fastmail.com",
  "hey.com",
  "tuta.com",
  "tutanota.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "ig.com.br",
  "globo.com",
  "r7.com",
];

const emailDomainCorrections = new Map([
  ["gm", "gmail.com"],
  ["gmai", "gmail.com"],
  ["gmail", "gmail.com"],
  ["gmal.com", "gmail.com"],
  ["gmial.com", "gmail.com"],
  ["gnail.com", "gmail.com"],
  ["gmail.con", "gmail.com"],
  ["gmail.co", "gmail.com"],
  ["hotmai", "hotmail.com"],
  ["hotmal.com", "hotmail.com"],
  ["hotmail.con", "hotmail.com"],
  ["outlok.com", "outlook.com"],
  ["outlook.con", "outlook.com"],
  ["yaho.com", "yahoo.com"],
  ["yahoo.con", "yahoo.com"],
  ["icloud.con", "icloud.com"],
  ["proton", "proton.me"],
  ["protonmail.con", "protonmail.com"],
  ["uol.com", "uol.com.br"],
]);

function getConfiguredDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

export function getAllowedEmailDomains() {
  return new Set([...defaultAllowedEmailDomains, ...getConfiguredDomains()]);
}

export function getEmailDomain(email: string) {
  const domain = email.split("@").at(-1)?.trim().toLowerCase().replace(/\.$/, "");

  return domain || null;
}

export function isAllowedRegistrationEmail(email: string) {
  const domain = getEmailDomain(email);

  return Boolean(domain && getAllowedEmailDomains().has(domain));
}

export function getEmailCorrectionSuggestion(email: string) {
  const [localPart, domainPart] = email.trim().toLowerCase().split("@");

  if (!localPart || !domainPart) {
    return null;
  }

  const suggestion = emailDomainCorrections.get(domainPart.replace(/\.$/, ""));

  if (!suggestion || suggestion === domainPart) {
    return null;
  }

  return `${localPart}@${suggestion}`;
}

export const registrationEmailRejectedMessage =
  "Não foi possível criar a conta com esse e-mail.";
