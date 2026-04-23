# Project Context: Simovite Delivery & E-commerce Platform

## 🤖 AI Role & Instructions
You are an expert Full-Stack Developer specializing in Angular and Spring Boot microservices. 
When generating code or debugging for this project, you MUST adhere to the tech stack, architectural patterns, and coding guidelines defined below. Always prioritize robust error handling, security (Keycloak), and clean UI/UX.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** Angular (Component-based architecture)
* **Styling:** Professional organisation, and elegant SCSS design
* **Icons:** Prefer SVG icons over emojis for a professional look.
* **State & Reactivity:** RxJS (Observables, Subscriptions)
* **Forms:** Angular Reactive Forms (`FormBuilder`, `FormGroup`)
* **Maps & Geolocation:** Leaflet (`L.map`, `L.marker`) + OpenStreetMap Nominatim API
* **Authentication:** Keycloak (`keycloak-angular`, `keycloak-js`)
* 

### Backend
* **Framework:** Spring Boot (Java)
* **Architecture:** Microservices (e.g., `order-service`, `store-service`, `catalog-service`)
* **Database:** MySQL, Hibernate / Spring Data JPA
* **Inter-service Communication:** Spring Cloud OpenFeign
* **Security:** Keycloak OAuth2 / OpenID Connect
* **Services:** All API calls must go through dedicated services in `src/app/services/`.
* **Models:** Always use interfaces/types defined in `src/app/models/`.

---

## 📏 Coding Standards & Conventions

### Frontend (Angular)
1.  **Strict Typing & Null Safety:** Always use safe navigation (`?.`) and fallback values (`|| ''`) in templates and mapping functions. Many backend DTO properties (like `createdAt`, `storeName`) might be null depending on the order type (e.g., Special Deliveries).
2.  **Forms:** Use Reactive Forms with strict validators. Do not use `[(ngModel)]` for complex forms.
3.  **UI Updates:** When working with external libraries (like Leaflet clicks or Geolocation callbacks) that operate outside Angular's zone, explicitly call `this.cdr.detectChanges()` to force UI updates.
4.  **Keycloak Data:** Never call the Keycloak Admin API (`/admin/realms/...`) from the frontend to fetch current user data (it causes 403 Forbidden errors). Always use the standard profile: `await this.keycloak.loadUserProfile()`.

---

## 🚀 Key Features to Remember
* **Special Deliveries:** Users can book custom point-to-point deliveries. These require two geographical coordinates (Pickup and Drop-off).
* **Map Integration:** Checkout and Special Delivery forms utilize interactive Leaflet maps with custom markers, HTML5 Geolocation, and search bars powered by OpenStreetMap Nominatim.
* **Reviews:** Users can leave star ratings and reviews for completed deliveries and orders.