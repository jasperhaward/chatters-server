import { describe, it } from "node:test";
import assert from "node:assert";

import {
  ConversationEventType,
  TConversationEvent,
  TRecipientsCreatedAggregateEvent,
} from "../schema";
import { applyAggregates } from "./eventsStore";
import {
  createMessageCreatedEvent,
  createConversationCreatedEvent,
  createRecipientCreatedEvent,
} from "../testUtils";

describe("applyEventAggregates()", () => {
  it("does not aggregate individual RecipientCreated events", () => {
    const events: TConversationEvent[] = [
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
      createRecipientCreatedEvent(),
      createConversationCreatedEvent(),
    ];

    assert.deepEqual(applyAggregates(events), events);
  });

  it("does not aggregate RecipientCreated events that are more than 1 minute apart", () => {
    const events: TConversationEvent[] = [
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
      createRecipientCreatedEvent({ createdAt: "2024-10-27T21:25:33.577Z" }),
      createRecipientCreatedEvent({ createdAt: "2024-10-27T21:24:23.577Z" }),
      createMessageCreatedEvent(),
    ];

    assert.deepEqual(applyAggregates(events), events);
  });

  it("does not aggregate RecipientCreated events that are created by different people", () => {
    const events: TConversationEvent[] = [
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
      createRecipientCreatedEvent({ createdBy: { id: "1", username: "" } }),
      createRecipientCreatedEvent({ createdBy: { id: "2", username: "" } }),
      createMessageCreatedEvent(),
    ];

    assert.deepEqual(applyAggregates(events), events);
  });

  it("creates the RecipientsCreatedAggregate aggregate event from the most recent events correctly", () => {
    const firstEvent = createRecipientCreatedEvent({
      createdAt: "2024-11-27T21:24:23.577Z",
      recipient: { id: "1", username: "Jose Choi" },
    });

    const secondEvent = createRecipientCreatedEvent({
      createdAt: "2024-11-27T21:24:13.577Z",
      recipient: { id: "2", username: "Andy Choi" },
    });

    const thirdEvent = createRecipientCreatedEvent({
      createdAt: "2024-11-27T21:24:13.577Z",
      recipient: { id: "2", username: "Jeff" },
    });

    const trailingEvents = [
      createMessageCreatedEvent(),
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
    ];

    const aggregateEvent: TRecipientsCreatedAggregateEvent = {
      ...firstEvent,
      type: ConversationEventType.RecipientsCreatedAggregate,
      recipients: [
        secondEvent.recipient, // recipients should be sorted alphabetically
        thirdEvent.recipient,
        firstEvent.recipient,
      ],
    };

    assert.deepEqual(
      applyAggregates([firstEvent, secondEvent, thirdEvent, ...trailingEvents]),
      [aggregateEvent, ...trailingEvents]
    );
  });

  it("creates the RecipientsCreatedAggregate aggregate event from the oldest events correctly", () => {
    const oldestEvent = createRecipientCreatedEvent({
      createdAt: "2024-11-27T21:24:03.577Z",
      recipient: { id: "1", username: "Jose Choi" },
    });

    const penultimateEvent = createRecipientCreatedEvent({
      createdAt: "2024-11-27T21:24:13.577Z",
      recipient: { id: "2", username: "Andy Choi" },
    });

    const leadingEvents = [
      createMessageCreatedEvent(),
      createRecipientCreatedEvent(),
      createMessageCreatedEvent(),
    ];

    const aggregateEvent: TRecipientsCreatedAggregateEvent = {
      ...penultimateEvent,
      type: ConversationEventType.RecipientsCreatedAggregate,
      recipients: [penultimateEvent.recipient, oldestEvent.recipient], // recipients should be sorted alphabetically
    };

    assert.deepEqual(
      applyAggregates([...leadingEvents, penultimateEvent, oldestEvent]),
      [...leadingEvents, aggregateEvent]
    );
  });
});
