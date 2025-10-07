# MetricAid API Structure Analysis

**Date**: 2025-10-07
**Endpoint**: `https://api.metricaid.com/public/schedule`
**Sample Data**: October 2025 (1,002 records)

## API Response Structure

### Top-Level Fields

```typescript
{
  data: Array<Shift>,      // Main payload with shift records
  paging: null | object,   // Pagination info (null in our response)
  status: {
    code: string,          // e.g., "General.Success"
    message: string        // e.g., "Success"
  },
  executedAt: string,      // ISO timestamp: "2025-10-07T17:27:03.070Z"
  timeElapsed: number,     // Response time in ms (e.g., 17)
  error: boolean           // Error flag
}
```

### Shift Record Structure

Each item in the `data` array has this structure:

```typescript
{
  slot_id: number,           // Unique slot ID (e.g., 6315021)
  date: string,              // "YYYY-MM-DD" format
  is_on_call: boolean,       // Whether this is an on-call shift
  start_time: string,        // "YYYY-MM-DD HH:MM:SS" format
  end_time: string,          // "YYYY-MM-DD HH:MM:SS" format
  is_weekend: boolean,       // Weekend indicator
  index: number,             // Position index

  shift: {
    id: number,              // Shift type ID
    name: string,            // Shift name (e.g., "Ds", "C.", "Nights 8:00pm - 8:00am")
    alias: string,           // Short alias (usually same as name)
    color: string,           // Hex color code (e.g., "#ffff99")
    type: number             // Shift type code (0 = ?)
  },

  user: {
    id: number | null,       // User ID (can be null for unassigned shifts)
    fname: string | null,    // First name (e.g., "Doctor ")
    mname: string | null,    // Middle name (usually empty string)
    lname: string | null,    // Last name (e.g., "15")
    export_id: string | null // External ID (usually empty string)
  },

  site: {
    id: number,              // Site/facility ID
    name: string,            // Full name (e.g., "Policlinico di Milano")
    short_name: string,      // Abbreviation (e.g., "PdM")
    timezone: {
      id: number,
      name: string           // IANA timezone (e.g., "Europe/Rome")
    }
  }
}
```

## Sample Data Statistics

**October 2025 Response:**
- Total records: **1,002**
- Unique shifts: **21**
- Unique users: **34**
- Response time: **555ms**

### Shift Types Found

1. C.
2. Ds
3. FT 8:30am - 6:30pm
4. J 8:00am - 8:00pm
5. Nights 8:00pm - 8:00am
6. OBI 8:00am - 8:00pm
7. OBIM 8:00am - 2:00pm
8. OBIP 2:00pm - 8:00pm
9. OTIM 8:00am - 2:00pm
10. OTIP 2:00pm - 8:00pm
11. On Call 1 - Weekends
12. On Call 2 - Weekends
13. Ortop 08:00am - 02:00pm
14. R
15. RAT 10:00am - 8:00pm
16. RATM 8:00AM - 2:00PM
17. RATP 11:30am - 8:00pm
18. RATP 2:00pm - 8:00pm
19. U
20. V
21. Ward 8:00am - 4:00pm

## Key Observations

### 1. User Data Format
- **fname**: Contains "Doctor " prefix with trailing space
- **lname**: Numeric identifier (e.g., "15", "16")
- **id**: Can be `null` for unassigned shifts
- **mname**: Usually empty string
- **export_id**: Usually empty string

**Example User**:
```json
{
  "id": 33949,
  "fname": "Doctor ",
  "mname": "",
  "lname": "15",
  "export_id": ""
}
```

### 2. Date/Time Handling
- **date**: Simple "YYYY-MM-DD" format
- **start_time/end_time**: "YYYY-MM-DD HH:MM:SS" format
- Times can vary within a day (not always 00:00:00)
- Shifts can span midnight (end_time next day)

**Examples**:
- Day shift: `2025-10-01 00:00:00` to `2025-10-02 00:00:00`
- Partial shift: `2025-10-23 08:00:00` to `...`
- Night shift: `2025-10-24 20:00:00` to `...`

### 3. Shift Names
- Some very short: "C.", "R", "U", "V", "Ds"
- Some descriptive with times: "Nights 8:00pm - 8:00am"
- **alias** field usually matches **name**
- All shifts have a color code

### 4. Multiple Shifts Per Day
A single user can have multiple shift records for the same day with different start times:
- User 33949 on 2025-10-23:
  - Shift at 08:00:00
  - Shift at 14:00:00

## Comparison with Worker Rust Types

### Current Worker Types (lib.rs:44-70)

```rust
struct UpstreamResponse {
    data: Vec<UpstreamShift>,
}

struct UpstreamShift {
    start_time: String,
    end_time: String,
    shift: ShiftDetails,
    user: UserDetails,
}

struct ShiftDetails {
    name: String,
    abbreviation: Option<String>,
}

struct UserDetails {
    id: Option<u64>,
    first_name: String,
    last_name: String,
}
```

### ❌ Mismatches Found

1. **User field names don't match**:
   - Worker expects: `first_name`, `last_name`
   - API provides: `fname`, `lname`, `mname`

2. **Shift has no `abbreviation` field**:
   - Worker expects: `abbreviation: Option<String>`
   - API provides: `alias: String` (always present, usually matches `name`)

3. **Missing additional API fields**:
   - Worker doesn't capture: `slot_id`, `date`, `is_on_call`, `is_weekend`, `site`, `color`, `index`
   - Worker doesn't capture: `mname`, `export_id` from user
   - Worker doesn't capture top-level: `status`, `paging`, `executedAt`, `timeElapsed`, `error`

## Recommendations

### Critical Fixes Needed

1. **Update `UserDetails` field names**:
   ```rust
   struct UserDetails {
       id: Option<u64>,
       fname: String,        // Changed from first_name
       lname: String,        // Changed from last_name
       #[serde(default)]
       mname: Option<String>, // Add optional middle name
   }
   ```

2. **Update `ShiftDetails`**:
   ```rust
   struct ShiftDetails {
       name: String,
       alias: String,        // Changed from abbreviation
       #[serde(default)]
       color: Option<String>, // Add color for future use
   }
   ```

3. **Use `alias` instead of `abbreviation` in transform logic**:
   ```rust
   // Current (line 302):
   let code = shift.shift.abbreviation.clone().unwrap_or_else(|| shift.shift.name.clone());

   // Should be:
   let code = shift.shift.alias.clone(); // Always present, no need for unwrap
   ```

### Optional Enhancements

Consider capturing for future features:
- `slot_id`: Unique identifier for editing/updates
- `date`: More reliable than parsing `start_time`
- `is_on_call`: Distinguish on-call vs regular shifts
- `site`: Multi-facility support
- `color`: Use API-provided colors instead of generated ones

## Testing Recommendations

1. **Test with multiple months**: Some months might have different data patterns
2. **Test empty responses**: January 2025 returned `data: []` - ensure worker handles this
3. **Test null user IDs**: Some shifts have `user.id: null` - verify ID generation logic
4. **Test multiple shifts per day**: Current transform might overwrite earlier shifts

## Files to Update

1. **worker/src/lib.rs**:
   - Lines 60-70: Update struct field names
   - Line 302-306: Use `alias` instead of `abbreviation`
   - Line 298: Update to use `fname`/`lname`

2. **CLAUDE.md** (documentation):
   - Update API structure description
   - Document actual field names
