export type ScenarioCategory =
  | "Abolition"
  | "Crisis Response"
  | "Conflict Management"
  | "Consent Violations"
  | "General Corporate Conflicts"
  | "Harm Dynamics";

export interface ScenarioTemplate {
  category: ScenarioCategory;
  contentWarnings: string[];
  title: string;
  body: string;
  /** Service / meeting types this scenario fits best. Empty = applies to all. */
  fitsServices?: string[];
}

const ALL_CATEGORIES: ScenarioCategory[] = [
  "Abolition",
  "Crisis Response",
  "Conflict Management",
  "Consent Violations",
  "General Corporate Conflicts",
  "Harm Dynamics",
];

export const SCENARIO_LIBRARY: ScenarioTemplate[] = [
  {
    category: "Abolition",
    contentWarnings: ["policing", "incarceration", "state violence"],
    title: "Campus security expansion proposal",
    body: "A university coalition is being asked to advise on a proposed expansion of campus police following a series of property incidents. Several student organizers are pushing for non-carceral alternatives — peer response teams, restorative circles, and community mediators. Faculty stakeholders are split. The client wants help structuring a working session that takes abolitionist frameworks seriously without alienating risk-averse administrators.",
    fitsServices: ["Workshops", "Panels and Talks", "Organizational Systems Work"],
  },
  {
    category: "Abolition",
    contentWarnings: ["surveillance", "labor coercion"],
    title: "Replacing punitive HR escalation paths",
    body: "A mid-sized nonprofit wants to redesign its disciplinary pipeline. Currently, low-level incidents escalate to formal warnings and termination. Leadership has asked for an abolition-informed framework: harm acknowledgement, accountability practices, and structural repair instead of punishment. Prepare a scoping conversation around what the org is willing — and not willing — to let go of.",
    fitsServices: ["One-on-One Consulting", "Organizational Systems Work"],
  },
  {
    category: "Crisis Response",
    contentWarnings: ["acute mental health crisis", "suicidality"],
    title: "Staff member in acute distress mid-event",
    body: "During a multi-day conference, a staff member discloses suicidal ideation to a colleague the night before they're scheduled to facilitate. The client is asking how to hold both the wellbeing of the individual and the continuity of the program. There is no on-site clinician. Prepare a triage flow: immediate safety, role coverage, follow-up care, and team communication that protects privacy.",
    fitsServices: ["Remote & In- Person Conferences", "Workshops"],
  },
  {
    category: "Crisis Response",
    contentWarnings: ["doxxing", "online harassment"],
    title: "Coordinated harassment campaign against a panelist",
    body: "A scheduled panelist has been targeted by a coordinated online harassment campaign in the 72 hours leading up to the event. Their personal information is circulating. The client wants guidance on whether to proceed, how to communicate with the panelist, security considerations for hybrid attendance, and a statement plan if the campaign escalates during the event.",
    fitsServices: ["Panels and Talks", "Remote & In- Person Conferences"],
  },
  {
    category: "Conflict Management",
    contentWarnings: ["interpersonal conflict", "workplace tension"],
    title: "Co-leads with unresolved trust rupture",
    body: "Two program co-leads have been quietly avoiding each other for months after a disagreement about credit on a public-facing project. Their team has noticed and is starting to take sides. Neither lead has formally raised the issue. The client wants a structured conversation to surface the rupture, name impact, and decide whether the partnership can continue.",
    fitsServices: ["One-on-One Consulting", "Organizational Systems Work"],
  },
  {
    category: "Conflict Management",
    contentWarnings: ["group conflict", "racialized dynamics"],
    title: "Caucus split after a community statement",
    body: "An advocacy organization published a statement that fractured its membership. A caucus of members of color feels the statement softened key political commitments; another caucus feels the statement went too far and risks funder relationships. The client is requesting a facilitated session that does not collapse the political disagreement into procedural conflict.",
    fitsServices: ["Workshops", "Panels and Talks"],
  },
  {
    category: "Consent Violations",
    contentWarnings: ["sexual harm", "boundary violation"],
    title: "Disclosure about a senior community member",
    body: "A participant has disclosed a consent violation by a senior, well-known community member who is scheduled to attend an upcoming gathering. The disclosing person is not asking for a formal process but does not want to be in the same room. The client needs help building an accountability-centered plan that does not require the survivor to perform their harm.",
    fitsServices: ["Remote & In- Person Conferences", "Workshops"],
  },
  {
    category: "Consent Violations",
    contentWarnings: ["coercion", "power imbalance"],
    title: "Manager-direct report relationship disclosed late",
    body: "A previously undisclosed romantic relationship between a manager and direct report has come to light after the relationship ended badly. The direct report is now describing coercive dynamics. The client wants guidance on a process that centers the direct report's agency, addresses the manager's role, and reckons with the organizational conditions that allowed it.",
    fitsServices: ["One-on-One Consulting", "Organizational Systems Work"],
  },
  {
    category: "General Corporate Conflicts",
    contentWarnings: ["layoffs", "economic precarity"],
    title: "Restructure announced without team consultation",
    body: "Leadership has announced a restructure that eliminates a full team with two weeks' notice. Remaining staff are demoralized and asking pointed questions about values alignment. The client wants help running an all-hands conversation that does not perform care it cannot back up, and a plan for trust repair with the people who stay.",
    fitsServices: ["Workshops", "One-on-One Consulting"],
  },
  {
    category: "General Corporate Conflicts",
    contentWarnings: ["board conflict", "leadership turnover"],
    title: "Board and ED in escalating conflict",
    body: "The board chair and executive director are in escalating conflict over the strategic direction of a foundation. Staff are caught in the middle and receiving contradictory instructions. The client wants a facilitated session, plus a written governance memo on decision rights, so the conflict can be held as a structural question instead of a personality one.",
    fitsServices: ["Organizational Systems Work", "One-on-One Consulting"],
  },
  {
    category: "Harm Dynamics",
    contentWarnings: ["interpersonal harm", "ongoing relationship"],
    title: "Repeated micro-harm without single incident",
    body: "A team member has reported a pattern of dismissive, racialized behavior from a peer that does not rise to any single reportable incident. Previous one-off conversations have not changed the pattern. The client wants help designing an accountability process that takes pattern-based harm seriously without requiring a 'big' incident as the entry point.",
    fitsServices: ["Workshops", "Organizational Systems Work"],
  },
  {
    category: "Harm Dynamics",
    contentWarnings: ["retraumatization", "institutional betrayal"],
    title: "Survivor asked to participate in 'healing' panel",
    body: "An organization has invited a survivor to speak on a healing-themed panel without first asking what conditions they would need. The survivor has agreed, then withdrawn, then re-agreed. The client wants a one-on-one prep session: informed consent, an exit plan during the event, and a debrief structure that does not put the survivor in charge of the audience's emotions.",
    fitsServices: ["Panels and Talks", "One-on-One Consulting"],
  },
];

/** Pick scenarios that fit a given meeting/service type, falling back to all. */
export function scenariosForService(service: string): ScenarioTemplate[] {
  const matches = SCENARIO_LIBRARY.filter(
    (s) => !s.fitsServices || s.fitsServices.some((f) => f.trim().toLowerCase() === service.trim().toLowerCase())
  );
  return matches.length > 0 ? matches : SCENARIO_LIBRARY;
}

export function randomScenarioForService(service: string, excludeCategories: ScenarioCategory[] = []): ScenarioTemplate {
  const pool = scenariosForService(service).filter((s) => !excludeCategories.includes(s.category));
  const list = pool.length > 0 ? pool : scenariosForService(service);
  return list[Math.floor(Math.random() * list.length)];
}

export { ALL_CATEGORIES };
