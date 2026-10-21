# The form must not move the reader (2026-10-21)

Feedback from the aledgent project, sent by its session on Pablo's instruction.

## Pablo's ruling (R35)

> The form shouldn't alter its navigation state (take a user out to where it's reading or responding) after a
> state change.

## What happened

The agent republished the decision form about once a minute while it updated its progress queue. Every publish
reloads every open view. Pablo was thrown out of his place each time, whether he was reading or typing an answer.
Narthex's own session republished its form twelve times on 2026-10-17, so Narthex has the same problem.

Narthex's template also has a quieter version of the bug. When the shared database reports any change, even the
echo of the reader's own answer, the page re-renders its whole view unless a text box has focus. That resets the
scroll position, the open items and the focus.

## What the product should guarantee (proposed by the aledgent session)

1. A change made by someone else (a new version, a changed item, a changed answer) never changes where the reader
   is. They keep the same tab, scroll position and open item, their half-typed text and their focus.
2. Content that changes often, such as a progress queue, lives in the shared database with a live subscription and
   is updated in place. It is never republished.
3. If a reload can't be avoided (the page's own code changed), the view is restored afterwards and unsent text is
   kept.
4. The reader is told when a newer version exists and chooses when to take it.

## What was done

- **aledgent:** its queue card reads a database document and is updated in place; the page is republished only
  when an item's text changes, in batches.
- **Narthex, 2026-10-21:** the decision-form template is being changed to:
  - update cards in place, ignoring the echo of the reader's own write;
  - restore the view after a republish, using the platform's hot-reload hook;
  - read a live queue and notice document that the agent updates without republishing.

## On the form

Item `d-reader-guarantees` asks whether guarantees 2 to 4 become requirements. Ruling R35 already covers
guarantee 1.
