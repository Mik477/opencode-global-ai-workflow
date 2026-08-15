# Agentenorientiertes Projekt-Knowledge-Management: Fallstudie, Marktbild und Best Practices

- **Stand:** 2026-08-14
- **Ziel:** Evidenzbasis fuer den cross-platform Agent Skill `bootstrapping-project-knowledge`
- **Lokale Ausgangsstudie:** `C:\Projects\MOT_FlyingObjects\docs\knowledge_system_case_study_and_playbook.md`

## 1. Evidenzdisziplin

Dieser Bericht trennt vier Arten von Aussagen:

- **Implementierungsevidenz:** im MOT-Repository direkt in Code, Records, Tests oder generierten Artefakten beobachtbar.
- **Dokumentierte Intention:** in Policies, Plaenen oder Skills formuliertes Verhalten; dies beweist keine technische Durchsetzung.
- **Offizielle Herstellerquelle:** aktuelle Dokumentation oder Engineering-Bericht von OpenAI, Anthropic oder einem anderen Hersteller.
- **Externe Forschung/Practitioner-Evidenz:** Paper, Open-Source-Implementierung, Issue oder konkreter Erfahrungsbericht.

Vendor-Benchmarks werden als Herstellerangaben behandelt. Sehr aktuelle 2026-Paper werden als Preprints gekennzeichnet. Marketplace-Eintraege gelten nicht als Provenienz, solange das Original-Repository und der tatsaechliche Skill-Inhalt nicht geprueft wurden.

## 2. Kurzfazit

Die MOT-Fallstudie gehoert zu den staerkeren praktisch implementierten Ansaetzen: Git-first, typisierte Markdown-Records, strikte lokale und repositoryweite Validierung, stabile IDs, Lifecycle, Evidence-Locators, reproduzierbare Projektionen, ein rebuildbarer FTS5-Cache, Impact-Routing und eine getrennte Research-Promotion-Grenze.

Die uebertragbare Best Practice ist jedoch **nicht**, dieses Vollsystem in jedes Repository zu kopieren. Der gemeinsame Nenner aktueller OpenAI-/Anthropic-Empfehlungen, Forschung und guter Practitioner-Systeme ist:

```text
Repository als System of Record
  -> kurze Routing-Map
  -> exakte/lexikalische Suche und just-in-time Exploration
  -> nur bei wiederkehrenden Trust-/Lifecycle-Problemen typisierte Records
  -> erst bei gemessenen Retrieval-Luecken Embeddings
  -> nur fuer nachgewiesene Mehrhop-/Impact-Fragen begrenzte Graphen
```

Die groesste Marktluecke ist ein kleiner portabler Skill, der nicht pauschal ein Memory-System installiert, sondern den Bedarf diagnostiziert, Authority und Trust explizit macht, die kleinste Stufe waehlt und Upgrades an lokale Evals bindet.

## 3. Aktuelle Frontier-Modelle und ihre Konsequenzen

### 3.1 OpenAI GPT-5.6

GPT-5.6 ist eine oeffentlich dokumentierte Modellfamilie. OpenAI veroeffentlichte am 9. Juli 2026 die Stufen Sol, Terra und Luna fuer ChatGPT, Codex und API. `gpt-5.6-sol` besitzt laut Modellseite ein Kontextfenster von 1.050.000 Tokens, maximal 922.000 Input- und 128.000 Output-Tokens. „ChatGPT 5.6“ ist keine eigene Produktbezeichnung; korrekt ist GPT-5.6 als Modell innerhalb von ChatGPT/Codex/API.

Relevante offizielle Hinweise:

- OpenAI empfiehlt fuer GPT-5.6 schlanke Prompts, eindeutige Autonomie-/Approval-Grenzen, wenige relevante Tools, Structured Outputs und repräsentative Evals.
- Lange Kontexte ueber 272.000 Input-Tokens haben laut Modellseite einen Preisaufschlag. Kontextkapazitaet ist deshalb auch bei GPT-5.6 kein Freibrief fuer Corpus-Preload.
- File Search kombiniert semantische und Keyword-Suche, bleibt aber ein gehosteter abgeleiteter Index mit Datenschutz-, Loesch- und Freshness-Fragen.
- Tool Search und Programmatic Tool Calling reduzieren grosse Tool-/Zwischenergebnis-Kontexte; sie ersetzen keine Knowledge-Authority.
- Server-seitige Compaction reduziert Verlauf, garantiert aber nicht, dass jedes projektrelevante Detail erhalten bleibt.

OpenAIs Engineering-Bericht „Harness engineering“ formuliert die fuer dieses Thema wichtigste Regel: **„give Codex a map, not a 1,000-page instruction manual.“** Das Team machte versionierte Repository-Dokumentation zum System of Record, hielt `AGENTS.md` als ungefaehr 100-zeilige Inhaltskarte und erzwang Struktur/Freshness ueber Linter, CI und Doc-Gardening.

### 3.2 Claude Fable 5 und Opus 5

Die vom Nutzer genannten Modelle existieren offiziell:

| Modell | Status am 2026-08-14 | Dokumentierte Rolle | Kontext/Output |
|---|---|---|---|
| Claude Fable 5 | allgemein verfuegbar, API-ID `claude-fable-5` | leistungsstaerkstes breit veroeffentlichtes Mythos-class Modell | 1M / 128k |
| Claude Opus 5 | allgemein verfuegbar, API-ID `claude-opus-5` | komplexes agentisches Coding und Enterprise-Arbeit | 1M / 128k |
| Claude Sonnet 5 | allgemein verfuegbar | Balance aus Geschwindigkeit und Intelligenz | 1M / 128k |
| Claude Mythos 5 | eingeschraenkt | defensive Cybersecurity/Project Glasswing | 1M / 128k |

Fable 5 und Mythos 5 verwenden laut Anthropic dasselbe zugrunde liegende Modell, unterscheiden sich aber durch Safeguards und Zugang. Opus 5 ist eine eigene spaetere Modellveroeffentlichung. Fable-5-Traffic hat laut Launch-Information besondere Retention-/Safeguard-Bedingungen; solche Oberflaechenunterschiede muessen in realen Deployments separat geprueft werden.

Anthropics offizielle Context-Engineering-Empfehlung bleibt trotz 1M-Fenstern eindeutig:

- Kontext ist eine endliche Attention-Ressource mit abnehmendem Grenznutzen.
- Ziel ist das kleinste Set hochsignifikanter Tokens, das das gewuenschte Verhalten erzeugt.
- `CLAUDE.md`/root instructions enthalten nur universell benoetigtes Wissen; Skills, Dateien, Tools und Subagenten liefern Details just in time.
- Fuer lange Arbeit werden Compaction, strukturierte Notizen und isolierte Subagent-Kontexte unterschieden.
- Claude Code trennt teamgeschriebenes `CLAUDE.md` von agentengeschriebener Auto-Memory. Auto-Memory ist keine automatisch kanonische Team-Wahrheit.
- Anthropic empfiehlt Skills mit No-Skill-Baseline, realistischen Evals und Tests ueber alle vorgesehenen Modellklassen.

### 3.3 Modellunabhaengige Schlussfolgerung

Million-Token-Kontext vergroessert die Kapazitaet, beseitigt aber weder Context Rot noch Authority-, Provenienz-, Freshness- oder Injection-Probleme. Der Skill darf deshalb keine Modellnamen als Architekturentscheidung einbauen. Er soll die exakte Modell-/Harness-Kombination in lokalen Evals festhalten.

## 4. Kritische Analyse der MOT-Fallstudie

### 4.1 Voll implementierte Staerken

Die folgenden Kernaussagen des Playbooks sind im Repository belegt:

- `knowledge/records/<type>/<ID>.md` ist der kanonische Store; JSONL, Schema, Manifest, SQLite und Sites sind abgeleitet.
- Frozen Pydantic-Modelle verbieten unbekannte Felder und validieren Record-Vertraege.
- Repositoryweite Checks pruefen Dateiname/Verzeichnis/ID/Typ, cross-record Lookups, Relationship-/Evidence-Ziele und deklarierte Pfade.
- Evidence-Links verlangen Source-ID, Locator und bounded Claim; Ziele muessen Source-Records sein.
- `active`, `uncertain` und `needs_review` bilden den Default-Search; historische/superseded/revoked Inhalte bleiben explizit abrufbar.
- `related()` traversiert ausgehende und eingehende Beziehungen begrenzt; `impacted()` routet aus geaenderten Pfaden zu abhaengigen Records.
- Projektionen sind byte-deterministisch und werden gegen kanonische Inputs verifiziert; der SQLite-Cache ist hashbasiert rebuildbar.
- CLI und Root-Map implementieren progressive Disclosure (`search`, `show`, `related`, `impacted`, JSON-Output).
- Research-Work-Packages und Candidate-Verzeichnisse existieren real; kanonische Promotion ist als Lead-Verantwortung dokumentiert.
- Die Tests pruefen nicht nur Parsing, sondern Graph-Links, stale Projektionen, Cache-Rebuild, Lifecycle-Filter, CLI und Projektvertrag.

### 4.2 Bewusst konventionelle Grenzen

- Die Lead-Promotion-Regel ist keine technische Schreibberechtigung.
- Lifecycle-Werte sind erzwungen, aber nicht alle semantischen Uebergaenge oder Nachfolgerlinks.
- Evidence-Locators werden nicht gegen den Quelltext verifiziert; URLs werden bei `verify` nicht neu geladen.
- Research-Run-Validierung deckt nicht alle Candidate- und Promotion-Artefakte ab.
- Security-Empfehlungen im Playbook sind noch keine Prompt-Injection-/Poisoning-Suite.
- Retrieval- und Impact-Qualitaet sind noch nicht mit einem produktionsnahen Query-/Change-Oracle gemessen.

### 4.3 Gefundene Drift und Fehler

Diese Punkte duerfen nicht ungeprueft in einen generischen Skill uebernommen werden:

1. Globale Titel-/Alias-Eindeutigkeit gilt zwischen Records; doppelte normalisierte Aliases innerhalb eines Records werden nicht separat abgelehnt.
2. Deklarierte „repository-relative“ Pfade werden nicht auf absolute Pfade oder `..`-Escapes begrenzt. Ein generischer Validator muss resolved containment pruefen.
3. Die FTS-Tabelle indexiert die Record-ID nicht; exakte IDs funktionieren ueber `show`, nicht zuverlaessig ueber Volltext-`search`.
4. `expected_projection_bytes()` sortiert nicht selbst; die deterministische Reihenfolge kommt vom Loader.
5. Candidate-Formate driften zwischen Markdown/JSON; ein eigener Candidate-Validator fehlt.
6. Dokumente widersprechen sich bei `verify -> index` versus `index -> verify`. Nach kanonischen Aenderungen muss die Reihenfolge eindeutig sein.
7. Ein realer Research-Run dokumentiert eine unerlaubte Delegation, wurde aber dennoch teilweise promoted. Ein generischer Skill braucht eine explizite Disposition fuer Governance-Verstoesse.
8. `EXP` ist ein unterstuetzter Typ, aber im aktuellen Corpus nicht belegt; Schema-Vokabular und tatsaechlich verwendete Typen muessen getrennt beschrieben werden.

### 4.4 Was uebertragbar ist

- eine kanonische plain-text Representation;
- strikte lokale plus repositoryweite Validierung;
- stabile Identitaet, Lifecycle und bounded Evidence;
- deterministische Projektionen plus disposable Cache;
- progressive Disclosure und strukturierte CLI-Ausgaben;
- Impact als Review-Routing statt Vollstaendigkeitsbeweis;
- isolierte Kandidaten und kontrollierte Promotion;
- Tests fuer Workflow/Governance, nicht nur Schema.

Nicht uebertragbar sind MOT-spezifische Typen, Relationen, Datensaetze, Methodenfamilien, Work-Package-Zahlen und Windows/Python-Annahmen.

## 5. Bestehende Skills und Community-Techniken

Es gibt viele gute Teilbausteine, aber keinen inspizierten Skill, der adaptive Komplexitaet, Authority, Provenienz, Lifecycle, Retrieval-Evaluation, Research-Promotion und Security gemeinsam sauber loest.

### 5.1 Rangierte Skill-Landschaft

| Skill/System | Staerke | Wiederverwendbare Technik | Hauptproblem |
|---|---|---|---|
| [Project Vault](https://github.com/gunqiuwang/project-vault) | umfassendes Projekt-OS | Phasen, Confidence/Review, Danger Zones, Audit/Sync | sehr gross, liest/aktualisiert zu viel, automatische Commits/Pushes, fragliche Lizenz-Provenienz |
| [Repo Memory](https://github.com/SubhoM/persistent-agent-context) | minimaler Markdown-Kern | ein kanonischer Einstieg, update-in-place, Redaction, thin adapters | „jede Session lesen“, unbelegte 80%-/Token-Ziele, vermischt teilweise aktuelle Richtung und dauerhafte Wahrheit |
| [AWS Knowledge Acquisition](https://github.com/aws-samples/sample-knowledge-acquisition-skill) | Research-Ingestion | immutable raw sources, atomare Notes, Source-first Distillation | Wiki-/AWS-Umfang, „obsolete entfernen“ kann Historie verlieren, hohe Infrastrukturbreite |
| [Basic Memory Skills](https://github.com/basicmachines-co/basic-memory/tree/main/skills) | Knowledge-Lifecycle | Capture, Curate, Promote, Reflect, Archive-not-delete | Runtime/MCP-Abhaengigkeit, AGPL, eher persoenliches/hybrides KM |
| [Cline Memory Bank](https://docs.cline.bot/prompting/cline-memory-bank) | einfache Projektkontinuitaet | Trennung Brief/Product/Active/Patterns/Tech/Progress | Corpus-Preload, keine Evidenz oder Supersession, Durable/Episodic vermischt |
| [Project Intelligence](https://github.com/christmasq/project-intelligence-skill) | strukturierte Extraction | Evidence, Confidence, Durability, Supersedes, Profile-Schemas | persistente Authority-/Retrieval-Schicht unklar; keine Lizenz |
| [Updating Project Notes](https://github.com/Con-Benksl/updating-project-notes) | Maintenance Routing | Facts -> Progress, Contract -> Spec, Why -> ADR, Ops -> Runbook | setzt vorhandenes System voraus, Obsidian-spezifische Teile |
| [Repo Atlas](https://github.com/cathrynlavery/repo-atlas) | Codebase-Navigation | rebuildbare Maps, Entry Points, Flows, Test-Matrix | standardmaessig viele manuelle Docs, Python/Make-Annahmen, Drift-Risiko |
| [Architecture Decision Records](https://github.com/wshobson/agents/tree/main/plugins/documentation-generation/skills/architecture-decision-records) | Entscheidungsverlauf | Status, Konsequenzen, Alternativen, Supersession | nur Subsystem, keine Retrieval-/Evidence-Governance |
| [Planning With Files](https://github.com/OthmanAdi/planning-with-files) | langlebige Task-Arbeit | Plan/Findings/Progress getrennt, Context-Rehydration | Task Memory, keine kanonische Projektwahrheit |
| [Handoff](https://github.com/kurosaki-sol/Handoff) | Session-Uebergabe | Commit-/Hash-Pins, Volatilitaet, Freshness, Supersession | fuer Routine zu komplex, host-spezifische Memory-Pfade |
| [Unified Memory](https://github.com/affaan-m/ECC/tree/main/skills/unified-memory) | cross-harness Memory | explizite User/Project/Team-Scopes und Provenienz | zusaetzliche Runtime, eher Agent-Memory als Repository-Wissen |
| [dev-km](https://github.com/goffity/dev-km) | Lern-Promotion | Raw Learnings -> Patterns -> Retrospektive -> Umsetzung | viele Custom Commands und Obsidian-Annahmen |
| [OpenAI Notion Skills](https://github.com/openai/plugins/tree/main/plugins/notion/skills) | externe Team-Capture | Source Links, Research-Dokumentation, Spec-to-Plan | SaaS/MCP, konkurrierendes System of Record, Datenschutz |

Marketplace-Zahlen sind unzuverlaessig: identische Mirrors werden oft als eigene Skills gezaehlt, Sterne koennen zum Aggregator gehoeren und „official“ ist ohne Owner-Provenienz kein Qualitaetssignal.

### 5.2 Was Practitioner konkret entwickelt haben

**Aider Repository Map:** token-budgetierte Datei-/Symbol-/Signatur-Map mit graphbasierter Relevanz. Sehr gut fuer Orientierung, aber kein dauerhafter Knowledge-Store.

**Serena Memories:** Markdown bleibt inspizierbar; Memory-Namen werden zuerst gezeigt, Inhalte on demand geladen. Symbol-/LSP-Navigation reduziert Vollfile-Reads. Onboarding-Ergebnisse brauchen dennoch Review/Freshness.

**Basic Memory/Obsidian MCP:** Markdown als Source of Truth, Abschnittsreads, chirurgische Updates, BM25/hybrid und rebuildbare Graphen. Issues zeigen reale Sync-/Index-Gefahren bis hin zu geloeschten oder wiederbelebten Notes.

**GitHub Copilot Memory:** kommerziell bemerkenswert wegen Code-Citations, Branch-Revalidierung, Review/Delete und 28-Tage-Expiry. Diese Controls sind staerker als reine Auto-Memory, aber proprietaer und nicht transparent implementiert.

**Graphiti/Zep:** temporaler Graph mit Episodes, Entities und Gueltigkeitsintervallen. Stark fuer zeitliches persoenliches/Application-Memory; hoher Extraktions-/Graph-/Embedding-Aufwand und Issues zu falscher Invalidierung oder dropped episodes.

**Letta/MemGPT, Mem0, LangGraph/LangMem:** nuetzlich fuer langlebige Agentenidentitaet, Nutzerpraeferenzen und episodische/semantische/prozedurale Memory. Sie sind kein Ersatz fuer reviewed Project Knowledge; automatische Extraktion braucht Promotion, TTL, Konflikt- und Datenschutzregeln.

**HumanLayer Research -> Plan -> Implement:** Research und Plan werden als reviewbare Markdown-Artefakte vor Implementierung gehalten; Subagent-Suchrauschen bleibt isoliert. Der Practitioner-Bericht dokumentiert auch Fehlschlaege durch falsche oder zu flache Research-Grundlage.

**Spec Kit/OpenSpec:** trennen Change-Intent (Spec/Plan/Tasks) von aktuellem Systemzustand. Nach Abschluss muessen akzeptierte Ergebnisse in kanonische Docs/ADRs konvergieren, sonst entsteht ein zweites historisches Wahrheitssystem.

**Beads/Task Ledgers:** stark fuer Multi-Agent-Koordination, Dependencies und Ownership; Task-Historie bleibt Ausfuehrungszustand und darf nicht zur Architekturwahrheit werden.

## 6. Forschungsstand

### 6.1 Long Context

- [Lost in the Middle](https://arxiv.org/abs/2307.03172), [RULER](https://arxiv.org/abs/2404.06654), [HELMET](https://arxiv.org/abs/2410.02694), [NoLiMa](https://arxiv.org/abs/2502.05167) und Chromas [Context Rot](https://research.trychroma.com/context-rot) zeigen in unterschiedlichen Settings: advertised context ist nicht gleich zuverlaessig nutzbarer Kontext; Distraktoren und fehlende lexikalische Ueberlappung verschlechtern Leistung.
- Diese Arbeiten verwenden meist aeltere Modelle oder kontrollierte Benchmarks. Sie beweisen keine exakte Degradationskurve fuer GPT-5.6/Fable 5, aber rechtfertigen lokale Kontext-/Retrieval-Evals.

### 6.2 Repository-Retrieval und Coding Agents

- [SWE-agent](https://arxiv.org/abs/2405.15793) zeigt, dass Agent-Computer-Interfaces und Repository-Tools Teil des Ergebnisses sind.
- [Agentless](https://arxiv.org/abs/2407.01489) zeigt, dass einfachere Localization/Repair/Validation-Pipelines komplexen Agenten konkurrenzfaehig sein koennen.
- [RepoCoder](https://arxiv.org/abs/2303.12570) stuetzt iterative Retrieval-/Generation-Loops.
- [CodeRAG-Bench](https://arxiv.org/abs/2406.14497) warnt: bessere Retrieval-Metriken garantieren keine bessere Code-Generation.
- Der sehr aktuelle Preprint [Deep Agentic Search for Repository-Level Code QA](https://arxiv.org/abs/2608.01507) berichtet in seinem spezifischen Harness Vorteile fuer indexierte semantische Suche gegenueber delegierter Grep-Suche. Das ist ein guter Grund zum Benchmarken, nicht zum universellen Default.

### 6.3 Memory und progressive Disclosure

- [LongMemEval](https://arxiv.org/abs/2410.10813) operationalisiert Extraktion, zeitliches Reasoning, Updates, Multi-Session-Synthese und Abstention.
- [ReFind](https://arxiv.org/abs/2608.12888) berichtet fuer rohe Chatlogs Vorteile agentengesteuerter lexikalischer Suche gegenueber komplexeren transformierten Memory-Systemen; es ist ein sehr neuer Preprint und nicht direkt Repository-KM.
- [Is Progressive Disclosure All You Need?](https://arxiv.org/abs/2607.17598) findet harness-/corpusabhaengige Vorteile einer flachen Disclosure-Stufe; eine zweite Stufe half nicht und konnte schaden.
- [Agent-Native Memory System](https://arxiv.org/abs/2606.24775) findet keinen dominanten Memory-Architekturtyp ueber alle Workloads.
- [HippoRAG](https://arxiv.org/abs/2405.14831) und [GraphRAG](https://arxiv.org/abs/2404.16130) zeigen Graph-Vorteile fuer bestimmte Mehrhop-/Global-Synthesis-Fragen, nicht fuer exakte Code-/Path-Suche.

### 6.4 Provenienz, Freshness und Security

- W3C [PROV-DM](https://www.w3.org/TR/prov-dm/) liefert die sinnvolle Trennung Entity/Activity/Agent sowie Derivation/Attribution/Invalidation.
- [CodeUpdateArena](https://arxiv.org/abs/2407.06249) zeigt die Schwierigkeit geaenderter API-Kenntnis und motiviert Supersession-/Changed-Source-Tests.
- [AgentDojo](https://arxiv.org/abs/2406.13352), [InjecAgent](https://arxiv.org/abs/2403.02691) und [PoisonedRAG](https://arxiv.org/abs/2402.07867) zeigen, dass Tool-Content, Retrieval und Ranking eigenstaendige Angriffsoberflaechen sind.
- OWASP LLM01/04 und NIST AI 600-1 empfehlen mehrschichtige Trust-, Provenienz-, Monitoring-, Test- und Incident-Kontrollen. Prompt-Sanitization allein ist keine Grenze.

## 7. Empfohlene Skill-Architektur

Der implementierte Skill `bootstrapping-project-knowledge` verwendet ein adaptives Modell:

- **Tier 0 Route:** kurze Root-Map, scoped Guidance, vorhandene ADR/Docs, exakte Suche, mechanische Checks.
- **Tier 1 Govern:** projektangepasste typisierte Records, stabile IDs, Lifecycle, Evidence, lokale und repositoryweite Validierung.
- **Tier 2 Retrieve:** deterministischer Katalog, disposable lexical Index, begrenzte Beziehungen/Impact, isolierte Research-Candidates, Promotion und Evals.

Embeddings, Graphen, MCP/Services und formale Exporte sind Upgrade-Optionen mit lokaler Query-/Task-Evidenz, Besitzer und Rollback. Der Skill enthaelt keine Runtime-Abhaengigkeit und keine universellen Projekt-Record-Typen.

Paketstruktur:

```text
skills/bootstrapping-project-knowledge/
  SKILL.md
  references/
    adaptive-tiers.md
    authority-and-records.md
    retrieval-and-evaluation.md
    research-and-security.md
    platform-adapters.md
  assets/
    routing-map-template.md
    knowledge-policy-template.md
    record-template.md
    evaluation-cases-template.yaml
  evals/evals.json
```

## 8. Skill-Evaluation: RED und GREEN

Vier Multi-Pressure-Faelle wurden in frischen Agent-Kontexten ohne Skill ausgefuehrt:

| Fall | No-Skill-Verhalten |
|---|---|
| Kleines stabiles Repository | korrekt Tier-0-aehnlich; Embeddings/Graph/Auto-Memory abgelehnt |
| Research-Monorepo mit Injection | Security/Promotion gut, aber Embeddings sofort statt nach gemessenem Lexical-Baseline-Gate |
| 70-Package-Monorepo | gute Authority-Trennung, aber sofort komplexer Katalog/Generator und erfundene universelle Zielwerte |
| API-Freshness-Update | korrekt: Reconciliation, Supersession, Projection-Rebuild und Tests trotz Druck |

Der Skill adressiert daher nicht nur Wissensluecken, sondern reduziert Entscheidungsvarianz unter Neuheits-, Zeit-, Umfangs- und Automationsdruck.

Mit Skill bestanden alle vier Faelle die vorgesehenen Assertions. Ein erster GREEN-Lauf erfand im Research-Szenario feste Kontext-/Result-Limits. Daraufhin wurde der Skill refaktoriert: operative Caps muessen als provisorisch markiert werden, Akzeptanzbudgets benoetigen lokale Baselines. Der gezielte Re-Test bestand.

Verbleibende empirische Grenze: Diese Session testete mit dem verfuegbaren OpenCode-Agentenmodell. Native Clean-Session-Evals in Claude Fable 5, Opus 5 und weiteren Clients/Modellklassen stehen vor einer oeffentlichen Freigabe noch aus.

## 9. Designentscheidungen

1. **Ein Orchestrator statt Skill-Suite.** Ein Trigger verhindert Discovery-Fragmentierung; Details werden progressiv geladen.
2. **Keine Generator-Runtime in v1.** Templates sind anpassbar; automatische Repo-Mutation waere fuer die variable Tier-Wahl zu riskant.
3. **Keine festen Typen.** Der MOT-Typkatalog ist projektspezifisch.
4. **Authority vor Retrieval.** Ein schneller Index ueber unklare Wahrheit verschlimmert das Problem.
5. **Lexical-first, aber nicht lexical-only.** Dense Retrieval bleibt eine gemessene Upgrade-Option.
6. **Episodic Memory getrennt.** Handoffs/Chat/Task-State duerfen nur durch Review in kanonisches Wissen gelangen.
7. **Security architektonisch.** Retrieved text bleibt Daten; technische Permissions/CI sichern harte Grenzen.
8. **Keine erfundenen Schwellenwerte.** Der Skill verlangt lokale Baselines fuer Kontext-, Result-, Alters- und Qualitaetsbudgets.

## 10. Wichtigste Quellen

### Offizielle Quellen

- OpenAI, [GPT-5.6 launch](https://openai.com/index/gpt-5-6/), 2026-07-09.
- OpenAI, [GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol), abgerufen 2026-08-14.
- OpenAI, [Harness engineering](https://openai.com/index/harness-engineering/), 2026-02-11.
- OpenAI, [Build skills](https://developers.openai.com/codex/build-skills), abgerufen 2026-08-14.
- OpenAI, [AGENTS.md instructions](https://developers.openai.com/codex/agent-configuration/agents-md), abgerufen 2026-08-14.
- OpenAI, [Using GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model), abgerufen 2026-08-14.
- OpenAI, [File search](https://developers.openai.com/api/docs/guides/tools-file-search), abgerufen 2026-08-14.
- OpenAI, [Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices), abgerufen 2026-08-14.
- Anthropic, [Models overview](https://platform.claude.com/docs/en/about-claude/models/overview), abgerufen 2026-08-14.
- Anthropic, [Claude Fable 5 and Mythos 5](https://www.anthropic.com/news/claude-fable-5-mythos-5), 2026-06-09, Updates bis 2026-07-01.
- Anthropic, [Claude Opus 5](https://www.anthropic.com/news/claude-opus-5), 2026-07-24.
- Anthropic, [Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 2025-09-29.
- Anthropic, [Claude Code memory](https://code.claude.com/docs/en/memory), abgerufen 2026-08-14.
- Anthropic, [Agent Skills best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), abgerufen 2026-08-14.
- Agent Skills, [Specification](https://agentskills.io/specification), abgerufen 2026-08-14.

### Practitioner und Open Source

- [Aider Repository Map](https://aider.chat/docs/repomap.html), Apache-2.0.
- [Serena memories](https://oraios.github.io/serena/02-usage/045_memories.html), MIT.
- [Basic Memory](https://github.com/basicmachines-co/basic-memory), AGPL-3.0.
- [Graphiti](https://github.com/getzep/graphiti), Apache-2.0.
- [Mem0](https://github.com/mem0ai/mem0), Apache-2.0.
- [Letta Code](https://github.com/letta-ai/letta-code), Apache-2.0.
- [LangMem](https://github.com/langchain-ai/langmem), MIT.
- [Cline Memory Bank](https://docs.cline.bot/prompting/cline-memory-bank).
- HumanLayer, [Advanced Context Engineering](https://www.humanlayer.dev/blog/advanced-context-engineering-for-ai-agents), 2025-08-29.
- [GitHub Spec Kit](https://github.com/github/spec-kit), MIT.
- [OpenSpec](https://github.com/Fission-AI/OpenSpec), MIT.

## 11. Abschlussregel

Ein gutes agentenorientiertes Knowledge-System maximiert nicht gespeicherte Information. Es minimiert die Zeit und den Kontext bis zu einer korrekten, aktuellen, belegten Entscheidung und macht sichtbar, wann diese Entscheidung unsicher, historisch oder moeglicherweise stale ist.

Der richtige Default fuer aktuelle Frontier-Modelle ist deshalb nicht „alles in den Kontext“ und nicht „automatische Memory ueber alles“, sondern:

```text
kurze Karte + kanonische Repository-Artefakte + just-in-time Evidenz
  + strikte Promotion/Validation
  + gemessene Upgrades
```
