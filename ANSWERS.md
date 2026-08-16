# QA Answers

> Fill these answers from the deployed application during the assessment. Do not invent results.

**QA run date:** 2026-08-17  
**Environment:** Production  
**Commit:**

## 1. What is the phone number of employee E-1001?

**Answer:** Employee E-1001’s phone number is **(628) 555-0010**.

**Sources:** HR

**Result:** PASS

## 2. Which facilities require a TB test?

**Answer:** **Oakview Commons (F-03)** in Santa Rosa requires a **TB test** (`TB_TEST`) as an additional facility credential. No TB test requirement is listed for the other five facilities.

**Sources:** Scheduling / Facility

**Result:** PASS

## 3. Which shifts require W-202 assigned in the next 5 days?

**Answer:** Within the next 5 calendar days, **August 16–20, 2026**, W-202 is assigned to: - **S-3240** — **August 18, 2026**, **07:00–15:00** - Facility: **F-03** - Role: **RN** - Status: **ASSIGNED** No other W-202 assignments fall in this period.

**Sources:** Scheduling

**Result:** PASS

## 4. Can Maria Santos take shift S-3243?

**Answer:** Maria Santos appears **potentially eligible**, but eligibility cannot be confirmed from the supplied data. - **Scheduling:** Maria Santos (`W-202`, matched by work email) is an RN, and shift **S-3243** is an open RN shift at Oakview Commons on **August 21, 2026, 15:00–23:00**. - **Scheduling:** No conflicting assignment for Maria is shown during that time. - **Required credentials:** RN license, CPR, and TB test. TB testing is also an Oakview Commons facility requirement. - **Missing:** No **HR employment status** or **Credentialing records** were supplied, so I cannot verify that Maria is currently employed/active or that her RN license, CPR, and TB test are valid and unexpired. **Conclusion:** She matches the role and appears available, but credential and employment verification are required before assigning her.

**Evidence considered:** employment status, worker role, shift role, credentials, facility requirements.

**Sources:** HR / Scheduling / Credentialing

**Result:** PASS

## 5. How many open shifts does Oakview Commons have in the next 7 days?

**Answer:** Oakview Commons has **3 open shifts** in the next 7 days (**August 16–22, 2026**): - **August 18:** CNA, 07:00–15:00 - **August 20:** LVN, 23:00–07:00 (ends August 21) - **August 21:** RN, 15:00–23:00

**Sources:** Scheduling / Facility

**Result:** PASS

## 6. What is employee E-1001's home address?

**Answer:** Employee E-1001’s home address is not provided in the available Meridian records.

**Sources:**

**Result:** PASS

## Testing Cannot Answer behavior

**Question:** What is employee E-1001's favorite food?

**Answer:** Employee E-1001’s favorite food is not recorded in the supplied Meridian data.

**Sources:**

**Result:** PASS

## QA notes

Record any date-relative behavior, ambiguous-name behavior, conflicting-record behavior, API errors, or limitations discovered during testing.
