Here is a comprehensive initial draft of the service specification for **MyGourmetDiary**.

---

# Service Specification: MyGourmetDiary

## 1. Vision & Core Concept

**Concept:** "Secretly peeking into a gourmet’s hidden notes."
**Mission:** To move beyond generic "star ratings" by connecting users with "Gourmet Friends"—curators whose specific tastes have been data-validated to match their own.
**Key Differentiator:** The "Taste-Sync" Validation. A user isn't just a "friend" because you know them; they are a "Gourmet Friend" because the system proves you enjoy the same specific flavors.

---

## 2. User Experience Flow

### 2.1 The "Silent" Community (No Comments/Replies)

* **The Philosophy:** To maintain the "diary" aesthetic, traditional social noise (arguments in comments, "thanks for sharing" replies) is removed.
* **Interaction:** Users interact via **"Taste Signals"**:
* **"Bookmarked"**: I want to try this.
* **"Tasted & Agreed"**: I tried this based on your note, and my rating is within 0.5 stars of yours. (This boosts the compatibility score).
* **"Tasted & Disagreed"**: I tried this, but our tastes diverged.



### 2.2 The "Binder" System (Subdivided Categories)

Gourmets do not just have one feed. They organize notes into **Binders**.

* *Example:* A user might love "Gourmet A's" **Whiskey Binder** but hate their **Spicy Food Binder**.
* **Functionality:** Users subscribe to specific Binders, ensuring their feed is relevant to their specific palate.

---

## 3. Core Features

### 3.1 Gourmet Notes (Content Creation)

The core unit of content is the "Note." It is structured data, not free-text rambling.

#### **A. Restaurant Notes**

* **Venue Data:** Auto-populated via **Yelp Fusion / Google Places API** (Name, Address, Hours).
* **Menu Item Level:** Users must rate specific dishes, not just the venue.
* **Structured Fields:**
* *Dish Name* (e.g., Truffle Risotto)
* *Rating* (1–5)
* *Price*
* *Tasting Tags* (e.g., "Salty," "Umami," "Crunchy")


* **Integration:**
* **Uber Eats/DoorDash API:** Checks if the rated item is currently deliverable.



#### **B. Beverage/Winery Notes**

* **Winery Visits:** Reviews of the winery experience (tasting room ambiance, service).
* **Bottle/Glass Notes:** Detailed logging for Wine, Sake, Whiskey, Tequila.
* **Integration:**
* **Vivino / Wine-Searcher APIs:** Users scan a label or type a name; the app pulls the vintage, grape varietal, and global baseline rating.


* **Specific Fields:** *Nose*, *Palate*, *Finish*, *Pairing Recommendation*.

### 3.2 The Recommendation Engine

#### **A. The "Gourmet Friend" Search**

When a user searches for a specific item (e.g., "Pinot Noir" or "Dim Sum"):

1. **Tier 1 Results:** Notes from verified "Gourmet Friends" (highest trust).
2. **Tier 2 Results:** Notes from users with >80% Taste Similarity Score.
3. **Tier 3 Results:** Highly rated items from the general public (Yelp/Vivino baselines).

#### **B. On-Premise Menu Decider**

* **Scenario:** User is seated at *Le Bernardin*.
* **Action:** User opens MyGourmetDiary.
* **Result:** The app highlights specific menu items that their Gourmet Friends have rated highly. "3 Friends recommend the Salmon; 0 recommend the Caviar."

### 3.3 Location & Discovery

* **"My Map":** A map view populated ONLY with pins from the user's selected Gourmet Friends.
* **Incentive Zones (The "Pioneer" Program):**
* If a user searches an area with no data, the system flags it as a **"Bounty Zone."**
* **Incentive:** The first 5 users to write detailed notes in this zone receive subscription credits or "Gourmet Points."



---

## 4. Technical Architecture & Integrations

### 4.1 Required External APIs

| API Name | Purpose |
| --- | --- |
| **Yelp Fusion / Google Places** | Restaurant metadata, location, hours, baseline public ratings. |
| **Vivino / Wine-Searcher** | Wine label recognition, vintage data, varietal classification. |
| **Uber Eats / DoorDash** | Checking delivery availability for specific recommended dishes. |
| **Stripe** | Handling subscription payments and creator payouts. |

### 4.2 Algorithm: The "Taste Similarity Matrix"

The system must calculate a vector score for every user relationship:


* **Sim(i):** Similarity of rating on Item  (high score if ratings are close).
* **Weight(c):** Weight of the category (e.g., if both users define themselves as "Wine Lovers," wine matches count double).
* **N:** Total number of overlapping items.

---

## 5. Monetization & Subscription

### 5.1 Free Tier ("The Peeker")

* View public notes.
* Search for restaurants/wines.
* Follow up to 3 "Gourmet Binders."
* Create unlimited personal notes.

### 5.2 Premium Tier ("The Connoisseur" - $X/mo)

* **Unlimited Following:** Follow unlimited Binders and Gourmet Friends.
* **"Menu Decider":** Access the real-time menu recommendation engine.
* **Advanced Filters:** Filter by specific taste profiles (e.g., "Show me High Acid Wines rated 4+ by friends").
* **Offline Mode:** Download notes for travel (crucial for winery visits in low-signal areas).

### 5.3 Creator Economy

* **Tipping:** Users can tip Gourmets for a great recommendation.
* **Bounty Hunter:** Users earn money/credits by reviewing spots in "Empty Zones" to build the database.

---

## 6. Development Roadmap

### Phase 1: The Notebook (MVP)

* Focus: Data Entry & Personal Log.
* Users can log restaurants and wines with API support.
* No social features yet.

### Phase 2: The Network

* Launch "Taste Compatibility" algorithm.
* Allow "Following" Binders.
* Implement "Gourmet Friend" validation logic.

### Phase 3: The Ecosystem

* Uber Eats/Delivery integration.
* Monetization (Subscription & Tipping).
* "Pioneer" Incentive program for geographic expansion.

---

### **Next Step**

Would you like me to draft the **Database Schema** (tables for Users, Notes, Taste_Graph, etc.) or create a **User Story/Walkthrough** for a specific feature (like "The Menu Decider")?
