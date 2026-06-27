# Project Requirements Document - Diet Management Module

## 1. Module Overview & Objectives
The Diet Management Module bridges trainers' nutritional guidance with members' daily food logging. It allows trainers to craft customized macro profiles and meal menus, and enables members to track daily food, protein, and water consumption.

The key objectives are to:
- Establish precise, goal-oriented daily caloric and macronutrient targets.
- Structure meal recommendations across designated slots (Breakfast, Lunch, Dinner, Snacks).
- Provide members with an effortless tracking engine to record meals and fluid intake.
- Visualize nutritional progress using intuitive progress bars and hydration charts.

---

## 2. User Roles & Permissions
- **Trainer**: Can create, modify, and assign diet plans to members. Trainers can view logs compiled by members to review adherence.
- **Member**: Can view assigned diet schedules, log water intake, and input consumed calories/protein. Members *cannot* change baseline target macros set by trainers.
- **Admin**: Can view general dashboard indicators and diet logs.

---

## 3. Database Schema Mapping
The module operates on two specific database structures within the schema:

### 3.1 DietPlan Model
Defines target metrics and meal menus.
- `id` (String, Primary Key)
- `trainerId` (String, ForeignKey linked to Trainer)
- `title` (String, e.g. "Ketogenic Cutting Phase")
- `breakfast` (String text instruction)
- `lunch` (String text instruction)
- `dinner` (String text instruction)
- `snacks` (String text instruction)
- `targetCalories` (Float, defaults to 2000 kcal)
- `targetProtein` (Float, defaults to 120 grams)
- `targetCarbs` (Float, defaults to 200 grams)
- `targetFats` (Float, defaults to 60 grams)
- `targetWaterMl` (Float, defaults to 3000 ml)
- `createdAt` / `updatedAt` (DateTime stamps)

### 3.2 DietLog Model
Tracks daily intake metrics logged by members.
- `id` (String, Primary Key)
- `memberId` (String, ForeignKey linked to Member)
- `dietPlanId` (String, ForeignKey linked to DietPlan)
- `logDate` (DateTime, defaults to current timestamp)
- `waterIntakeMl` (Float, logs water consumed in ml)
- `caloriesLog` (Float, logs calories consumed in kcal)
- `proteinLog` (Float, logs protein consumed in grams)

---

## 4. Frontend Route Structure
- **Trainer View**: `[trainer/members/[id]/diet/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/trainer/members/%5Bid%5D/diet/page.tsx)`: Interface for draft configuration, target macro inputs, and text slots.
- **Member View**: `[member/diet/page.tsx](file:///c:/Users/HP/Downloads/full%20stack%20application/src/app/(dashboard)/member/diet/page.tsx)`: Hydration widgets, meal schedules, and macro intake logs.

---

## 5. Detailed Functional Specifications

### 5.1 Trainer Interface (Diet Planning)
- **Macro Distribution Split**: Offers dynamic inputs for Calories, Protein, Carbs, and Fats. Generates a live circular chart rendering calorie totals against percentage splits:
  - Total Calories check: $\text{Calories} \approx (\text{Protein} \times 4) + (\text{Carbs} \times 4) + (\text{Fats} \times 9)$
- **Daily Meal Sections**: Structured fields (rich textarea) for writing menus:
  - *Breakfast* (e.g., "4 egg whites, 50g oats with whey protein")
  - *Lunch* (e.g., "150g grilled chicken, 100g basmati rice, mixed greens")
  - *Snacks* (e.g., "Handful of almonds, 1 green apple")
  - *Dinner* (e.g., "150g salmon, steamed broccoli")

### 5.2 Member Interface (Nutritional Logging)
- **Water Hydration Tracker**: 
  - Dynamic visual cup/bottle widget showing a filling blue/cyan fluid level based on logged intake.
  - One-click quick logger buttons: `+250ml` (glass), `+500ml` (shaker), `+1000ml` (large jug).
- **Macro Progress Ring**: Dynamic display showing totals logged today vs. trainer-defined caps (e.g., "75g / 150g Protein").
- **Meal Check-Off Feed**: Shows the target meals. Allows entering exact calorie and protein values consumed for each meal category.

---

## 6. API Specifications

### 6.1 Create or Update Diet Plan (`POST /api/fitness/diets`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `TRAINER`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-123",
    "title": "Clean Bulk Plan",
    "breakfast": "Oatmeal and Egg whites",
    "lunch": "Chicken breast and Brown rice",
    "dinner": "Salmon and Sweet potatoes",
    "snacks": "Whey protein shake and Cashews",
    "targetCalories": 2800.0,
    "targetProtein": 180.0,
    "targetCarbs": 320.0,
    "targetFats": 80.0,
    "targetWaterMl": 4000.0
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "dietPlan": {
      "id": "diet-plan-uuid-999",
      "title": "Clean Bulk Plan",
      "targetCalories": 2800.0
    }
  }
  ```

### 6.2 Log Consumption Details (`POST /api/fitness/diet-logs`)
- **Request Body**:
  ```json
  {
    "memberId": "member-uuid-123",
    "dietPlanId": "diet-plan-uuid-999",
    "waterIntakeMl": 500.0,
    "caloriesLog": 650.0,
    "proteinLog": 42.0
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "dietLog": {
      "id": "log-entry-uuid",
      "logDate": "2026-06-25T13:46:00.000Z",
      "waterIntakeMl": 500.0,
      "caloriesLog": 650.0,
      "proteinLog": 42.0
    }
  }
  ```

### 6.3 Fetch Daily Nutritional Status (`GET /api/fitness/diet-logs/today`)
- **Headers**: `Authorization: Bearer <Token>` (Role: `MEMBER`)
- **Query Parameters**: `memberId=member-uuid-123&date=2026-06-25`
- **Success Response (200)**:
  ```json
  {
    "target": {
      "calories": 2800.0,
      "protein": 180.0,
      "water": 4000.0
    },
    "consumed": {
      "calories": 1850.0,
      "protein": 115.0,
      "water": 2500.0
    }
  }
  ```

---

## 7. Edge Cases & Client-Side Safety Rules
- **Daily Reset**: Logs must aggregate based on the member's local time zone, resetting to 0 at midnight.
- **Null Safety**: If a trainer assigns no target values, the member page displays default baseline metrics: 2000 kcal, 100g protein, and 3000ml water.
- **Visual Limit Caps**: The water logger liquid animation caps at 150% of the daily goal to prevent UI scaling issues when intake exceeds the target.
- **Input Sanitization**: Block negative log entries on the client and server side.
