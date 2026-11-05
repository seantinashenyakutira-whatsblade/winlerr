# Winlerr product catalogue

The public product catalogue is rendered from [`apps/web/src/data/product-catalogue.ts`](../../apps/web/src/data/product-catalogue.ts). Product detail pages, catalogue cards, the systems overview, and the sitemap use that typed data source.

## Initial catalogue

| Offering                           | Public route                                   | Category                                |
| ---------------------------------- | ---------------------------------------------- | --------------------------------------- |
| Free Professional Business Website | `/products/free-professional-business-website` | Websites                                |
| Lead Response                      | `/products/lead-response`                      | Business automation systems             |
| WhatsApp AI Agent                  | `/products/whatsapp-ai-agent`                  | AI agents                               |
| Social DM Agent                    | `/products/social-dm-agent`                    | AI agents                               |
| Booking System                     | `/products/booking-system`                     | Business automation systems             |
| Customer Follow-up                 | `/products/customer-follow-up`                 | Business automation systems             |
| AI Receptionist                    | `/products/ai-receptionist`                    | AI agents; business operations          |
| WinlerrOS                          | `/products/winlerros`                          | WinlerrOS platform; business operations |

## Availability and pricing

Availability and pricing require the reviewed Systems Lab catalogue specification. Until that contract is approved, public entries use a confirmation label and the `pricing` field remains `null`. The website must not present proposed workflows as operational or invent prices.

## Product documentation

Keep public product facts in the typed catalogue. Add implementation architecture, operational runbooks, and integration contracts here only after those details are reviewed and confirmed by the owning team.
