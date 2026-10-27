import type { PublicData } from "./api";
// Confirmed public baseline from Django migration 0003 and seed_services.
// Never includes private, user-generated or unpublished material.
export const publicFallback: PublicData = {
  "company": {
    "official_name": "ESTMAJO ENGINEERING SOLUTIONS LTD",
    "registration_number": "7810123",
    "primary_email": "estmajo@hotmail.com",
    "use_supplied_logo": true,
    "logo": {
      "id": 0,
      "kind": "image",
      "name": "ESTMAJO logo",
      "url": "/brand/estmajo-logo.jpg",
      "alt": "ESTMAJO ENGINEERING SOLUTIONS LTD",
      "caption": "",
      "responsive": {}
    },
    "short_intro": "Engineering, installation and maintenance services, with logistics, procurement and construction support. Contact our Warri office to discuss your project requirements.",
    "description": "ESTMAJO ENGINEERING SOLUTIONS LTD is based in Warri, Delta State, Nigeria. Our service areas include HVAC, electrical and solar installation and maintenance; logistics, supply chain management and procurement; operations and maintenance; instrumentation and control systems; and civil engineering and construction.\n\nContact our team with your project location, requirements and preferred schedule to discuss scope and request a quotation.",
    "footer_description": "Engineering, installation, maintenance, procurement and construction services. Warri, Delta State, Nigeria.",
    "phones": [
      {
        "label": "Main telephone",
        "number": "+2348123834601",
        "extension": "",
        "primary": true,
        "visible": true,
        "order": 0
      },
      {
        "label": "Additional telephone",
        "number": "+2347065938360",
        "extension": "",
        "primary": false,
        "visible": true,
        "order": 1
      }
    ],
    "offices": [
      {
        "label": "Warri Office",
        "address": "D5 Edewor Estate, Opposite Shafa Filling Station, By Enerhen Motel",
        "city": "Warri",
        "region": "Delta State",
        "postcode": "",
        "country": "Nigeria",
        "map_url": "",
        "directions_url": "",
        "visible": true,
        "order": 0
      }
    ],
    "copyright_owner": "ESTMAJO ENGINEERING SOLUTIONS LTD",
    "seo_title": "ESTMAJO Engineering Solutions Ltd | Warri, Delta State",
    "seo_description": "Contact ESTMAJO Engineering Solutions Ltd in Warri, Delta State, Nigeria for engineering, installation, maintenance, procurement and construction enquiries."
  },
  "content": [
    {
      "id": 1,
      "kind": "service",
      "slug": "hvac-system-installation-and-maintenance",
      "title": "HVAC System Installation and Maintenance",
      "summary": "",
      "body": "",
      "published": true,
      "order": 0,
      "attachments": []
    },
    {
      "id": 2,
      "kind": "service",
      "slug": "electrical-installation-and-maintenance",
      "title": "Electrical Installation and Maintenance",
      "summary": "",
      "body": "",
      "published": true,
      "order": 1,
      "attachments": []
    },
    {
      "id": 3,
      "kind": "service",
      "slug": "solar-energy-system-installation-and-maintenance",
      "title": "Solar Energy System Installation and Maintenance",
      "summary": "",
      "body": "",
      "published": true,
      "order": 2,
      "attachments": []
    },
    {
      "id": 4,
      "kind": "service",
      "slug": "logistics-supply-chain-management-and-procurement",
      "title": "Logistics, Supply Chain Management and Procurement",
      "summary": "",
      "body": "",
      "published": true,
      "order": 3,
      "attachments": []
    },
    {
      "id": 5,
      "kind": "service",
      "slug": "operations-and-maintenance",
      "title": "Operations and Maintenance",
      "summary": "",
      "body": "",
      "published": true,
      "order": 4,
      "attachments": []
    },
    {
      "id": 6,
      "kind": "service",
      "slug": "instrumentation-and-control-system-installation-and-maintenance",
      "title": "Instrumentation and Control System Installation and Maintenance",
      "summary": "",
      "body": "",
      "published": true,
      "order": 5,
      "attachments": []
    },
    {
      "id": 7,
      "kind": "service",
      "slug": "civil-engineering-and-construction",
      "title": "Civil Engineering and Construction",
      "summary": "",
      "body": "",
      "published": true,
      "order": 6,
      "attachments": []
    }
  ],
  "gallery": [],
  "documents": []
};
