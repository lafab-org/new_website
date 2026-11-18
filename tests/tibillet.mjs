// Sample stand-in for TiBillet, for the tests and for local development:
// the events and the reservations, in the form of the API's answers.
// Dates are relative to the day the module is read, in Paris, so that
// séances always fall in the coming days.

// The day in Paris when the module is read, as [year, month, day].
const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date()).split("-").map(Number);

// The offset of Paris from UTC at an instant, as "+01:00".
const offset = (instant) => {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris", timeZoneName: "longOffset",
  }).formatToParts(instant).find((p) => p.type === "timeZoneName").value;
  return name === "GMT" ? "+00:00" : name.replace("GMT", "");
};

// The date-time, in Paris, `days` days after today at `time` ("18:00").
function at(days, time) {
  const [h, mi] = time.split(":").map(Number);
  const local = new Date(Date.UTC(y, m - 1, d + days, h, mi));
  const day = local.toISOString().slice(0, 10);
  const o = offset(new Date(local.getTime() - 60 * 60 * 1000));
  return `${day}T${time}:00${o}`;
}

export default {
  "events": {
    "results": [
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000001",
        "name": "Club retouches spécial fêtes",
        "startDate": at(0, "18:00"),
        "endDate": at(0, "20:00"),
        "url": "https://tibillet.example/event/club-retouches/",
        "maximumAttendeeCapacity": 8,
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "matériaux-souples",
          "club-retouches",
          "réservation-gratuite"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000002",
        "name": "Initiation au soudage",
        "startDate": at(2, "09:30"),
        "endDate": at(2, "12:30"),
        "url": "https://tibillet.example/event/initiation-soudage/",
        "maximumAttendeeCapacity": 4,
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "initiation-soudage",
          "métal",
          "réservation-payante"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000003",
        "name": "Portes ouvertes",
        "startDate": at(2, "14:00"),
        "endDate": null,
        "url": "https://tibillet.example/event/portes-ouvertes/",
        "maximumAttendeeCapacity": 0,
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "association",
          "portes-ouvertes",
          "libre"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000004",
        "name": "Répar'Action",
        "startDate": at(6, "14:00"),
        "endDate": at(6, "17:00"),
        "url": "https://tibillet.example/event/repar-action/",
        "eventStatus": "https://schema.org/EventCancelled",
        "keywords": [
          "numérique-électronique",
          "repar-action",
          "sur-place"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000005",
        "name": "Week-end bois massif",
        "startDate": at(7, "09:00"),
        "endDate": at(8, "17:00"),
        "url": "https://tibillet.example/event/week-end-bois-massif/",
        "maximumAttendeeCapacity": 6,
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "bois"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000006",
        "name": "Atelier passé",
        "startDate": at(-600, "10:00"),
        "endDate": at(-600, "12:00"),
        "url": "https://tibillet.example/event/atelier-passe/",
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "bois",
          "libre"
        ]
      },
      {
        "@type": "Event",
        "identifier": "00000000-0000-4000-8000-000000000007",
        "name": "Soirée privée",
        "startDate": at(1, "19:00"),
        "url": "https://tibillet.example/event/soiree-privee/",
        "eventStatus": "https://schema.org/EventScheduled",
        "keywords": [
          "privé"
        ]
      }
    ]
  },
  "reservations": {
    "00000000-0000-4000-8000-000000000001": {
      "results": [
        {
          "@type": "Reservation",
          "identifier": "10000000-0000-4000-8000-000000000001",
          "reservationFor": {
            "@type": "Event",
            "identifier": "00000000-0000-4000-8000-000000000001",
            "name": "Club retouches spécial fêtes"
          },
          "reservationStatus": "https://schema.org/ReservationConfirmed",
          "reservedTicket": [
            {
              "@type": "Ticket",
              "identifier": "20000000-0000-4000-8000-000000000001",
              "ticketQuantity": 2
            }
          ]
        },
        {
          "@type": "Reservation",
          "identifier": "10000000-0000-4000-8000-000000000002",
          "reservationFor": {
            "@type": "Event",
            "identifier": "00000000-0000-4000-8000-000000000001",
            "name": "Club retouches spécial fêtes"
          },
          "reservationStatus": "https://schema.org/ReservationPending",
          "reservedTicket": [
            {
              "@type": "Ticket",
              "identifier": "20000000-0000-4000-8000-000000000002",
              "ticketQuantity": 1
            }
          ]
        },
        {
          "@type": "Reservation",
          "identifier": "10000000-0000-4000-8000-000000000003",
          "reservationFor": {
            "@type": "Event",
            "identifier": "00000000-0000-4000-8000-000000000001",
            "name": "Club retouches spécial fêtes"
          },
          "reservationStatus": "https://schema.org/ReservationCancelled",
          "reservedTicket": [
            {
              "@type": "Ticket",
              "identifier": "20000000-0000-4000-8000-000000000003",
              "ticketQuantity": 4
            }
          ]
        }
      ]
    },
    "00000000-0000-4000-8000-000000000002": {
      "results": [
        {
          "@type": "Reservation",
          "identifier": "10000000-0000-4000-8000-000000000004",
          "reservationFor": {
            "@type": "Event",
            "identifier": "00000000-0000-4000-8000-000000000002",
            "name": "Initiation au soudage"
          },
          "reservationStatus": "https://schema.org/ReservationConfirmed",
          "reservedTicket": [
            {
              "@type": "Ticket",
              "identifier": "20000000-0000-4000-8000-000000000004",
              "ticketQuantity": 3
            },
            {
              "@type": "Ticket",
              "identifier": "20000000-0000-4000-8000-000000000005",
              "ticketQuantity": 1
            }
          ]
        }
      ]
    },
    "00000000-0000-4000-8000-000000000003": {
      "results": []
    },
    "00000000-0000-4000-8000-000000000004": {
      "results": []
    },
    "00000000-0000-4000-8000-000000000005": {
      "results": []
    },
    "00000000-0000-4000-8000-000000000006": {
      "results": []
    },
    "00000000-0000-4000-8000-000000000007": {
      "results": []
    }
  }
};
