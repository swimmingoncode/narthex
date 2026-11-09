# A reading path from mid-level to senior and staff engineer (2026-10-26)

Pablo asked what a mid-level engineer who is already strong at data structures, algorithms and architecture should
learn next, and whether there are books that teach it before tools such as Narthex. This is Narthex's advice. The
titles come from memory: check editions before buying. [unverified]

## The short answer

Yes: method comes before tools. Narthex and similar skill sets encode practices that these books explain, and a tool
used without the reasons behind it is a ritual. Two cautions, though:

- **Seniority is judgement, not theory.** It means choosing under ambiguity, explaining trade-offs, and owning outcomes
  across teams. Reading gives the vocabulary; only practice with feedback gives the judgement.
- **Read and practise in turns.** Do one book and one exercise per stage, not all the reading first.

## The path

Each stage has a core book (read it whole), further reading, and an exercise.

### 0. The map

- Core: *Software Engineering at Google* (Winters, Manshreck, Wright, 2020). The best bridge from writing code to
  engineering over time and at scale.
- Further: *SWEBOK Guide* v4 (IEEE Computer Society, 2024, free), used as a map of the field rather than read cover to
  cover; *The Mythical Man-Month* (Brooks, anniversary edition 1995), with "No Silver Bullet".
- Exercise: list the five decisions on your current project you'd least like to defend, and why.

### 1. Methodologies and process

- Core: *Software Engineering* (Sommerville, 10th ed.). The survey textbook: life-cycle models, agile and plan-driven
  processes, and where each fits.
- Further: *Extreme Programming Explained* (Beck, 2nd ed.); *Continuous Delivery* (Humble, Farley); *Accelerate*
  (Forsgren, Humble, Kim, 2018), for evidence on what actually improves delivery.
- Exercise: describe your team's real process as it is, not as written, and name one practice with evidence behind
  it that you'd change.

### 2. Requirements engineering

The step most engineers skip, and the one that most separates senior engineers from mid-level ones.

- Core: *Software Requirements* (Wiegers, Beatty, 3rd ed., 2013). The practical standard: elicitation, analysis,
  specification, validation.
- Further: *Mastering the Requirements Process* (Robertson, Robertson; the Volere template); *Writing Effective Use
  Cases* (Cockburn); *User Story Mapping* (Patton); *Specification by Example* (Adzic).
- Rigour: *Requirements Engineering* (van Lamsweerde, 2009), goal-oriented; the EARS notation paper (Mavin et al.,
  2009); the standard ISO/IEC/IEEE 29148.
- Exercise: write a real SRS for one feature of an open-source project, in EARS, with each requirement traced to a
  test. Then have someone else build from it and log every question they ask you. Each question is a defect in the SRS.

### 3. Architecture, as theory

He is already good at this, so the gap is method: quality attributes, views and evaluation.

- Core: *Software Architecture in Practice* (Bass, Clements, Kazman, 4th ed., 2021). Quality-attribute scenarios and
  the ATAM evaluation method.
- Further: *Documenting Software Architectures: Views and Beyond* (Clements et al.); *Fundamentals of Software
  Architecture* (Richards, Ford); *Designing Data-Intensive Applications* (Kleppmann); *Domain-Driven Design* (Evans);
  *A Philosophy of Software Design* (Ousterhout). Standards and practices: ISO/IEC/IEEE 42010, Nygard's ADRs and the
  C4 model.
- Exercise: write ADRs, after the fact, for three past decisions in a system you know, and run a light ATAM on it with
  two colleagues.

### 4. Verification and operations

- Core: *Introduction to Software Testing* (Ammann, Offutt).
- Further: *Working Effectively with Legacy Code* (Feathers); *Release It!* (Nygard).
- Exercise: read ten public postmortems and, for each, name the requirement or test that would have caught it.

### 5. Formal specification (optional, for safety or critical work)

- *Software Abstractions* (Jackson; the Alloy tool); *Specifying Systems* (Lamport; TLA+); *Practical TLA+* (Wayne).
- Exercise: model one concurrency or state invariant from your own system and let the checker find a counterexample.

### 6. The staff part

Not technical, and the stage people underrate most.

- Core: *The Staff Engineer's Path* (Reilly, 2022).
- Further: *Staff Engineer* (Larson, 2021); *An Elegant Puzzle* (Larson).
- Exercise: write a design document for a change that touches another team, and get it accepted.

## Then the tools

After stages 1 to 3, a tool such as Narthex reads as a known set of practices put into a loop, and its gaps become
visible. That is the right moment to adopt one.
