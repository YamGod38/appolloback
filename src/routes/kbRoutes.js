const express = require('express');
const router = express.Router();
const KnowledgeBaseModel = require('../models/KnowledgeBaseModel');
const authMiddleware = require('../utils/authMiddleware');

router.get('/search', authMiddleware(), async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        
        const results = await KnowledgeBaseModel.search(q);
        if (results && results.length > 0) {
            return res.json(results);
        } else {
            throw new Error('No results from DB, fallback to mock');
        }
    } catch (error) {
        // Mock fallback if DB is offline
        console.error('DB Offline, returning mock KB results');
        res.json([
            { id: 1, title: 'Blood Pressure Protocol', content: 'If patient reports BP > 140/90, instruct them to sit quietly for 5 minutes and re-measure. If still high, escalate to senior cardiologist.', tags: ['bp', 'blood pressure', 'hypertension', 'heart'] },
            { id: 2, title: 'Hotel Suite Pricing', content: 'Presidential suite is $500/night. Executive suite is $350/night. Both include complimentary breakfast and spa access.', tags: ['price', 'room', 'hotel', 'suite', 'booking'] },
            { id: 3, title: 'Sugar Testing Protocol', content: 'Instruct patient to fast for 12 hours before test. Only water is permitted. No coffee, tea, or chewing gum.', tags: ['sugar', 'diabetes', 'glucose', 'fasting', 'test'] },
            { id: 4, title: 'Appointment Cancellation Policy', content: 'Cancellations must be made at least 24 hours in advance to avoid a 50% penalty fee. Rescheduling within 24 hours is allowed once for free.', tags: ['cancel', 'policy', 'appointment', 'fee'] },
            { id: 5, title: 'General Checkup Prep', content: 'Patient should arrive 15 minutes early to fill out forms. Bring valid ID and current insurance card.', tags: ['checkup', 'prep', 'insurance', 'forms'] },
            { id: 6, title: 'Post-Surgery Care', content: 'Keep the surgical site clean and dry. Change dressings daily. Take prescribed antibiotics to completion.', tags: ['surgery', 'care', 'recovery', 'wound'] },
            { id: 7, title: 'Pediatric Fever Guidelines', content: 'For children under 3 months with a fever above 100.4°F (38°C), advise immediate emergency room visit. For older children, administer weight-appropriate acetaminophen.', tags: ['fever', 'pediatric', 'child', 'temperature', 'emergency'] },
            { id: 8, title: 'Emergency Room Intake', content: 'Prioritize chest pain, difficulty breathing, and severe bleeding. Send immediately to triage.', tags: ['emergency', 'triage', 'er', 'chest pain'] },
            { id: 9, title: 'Prescription Refill Process', content: 'Refill requests take 48 hours to process. Patient must have had an appointment within the last 6 months for chronic medications.', tags: ['prescription', 'refill', 'medication', 'pharmacy'] },
            { id: 10, title: 'Dietary Consultation Prep', content: 'Patient should keep a 3-day food diary prior to the appointment. Include all meals, snacks, and beverages.', tags: ['diet', 'food', 'nutrition', 'consultation'] },
            { id: 11, title: 'Hotel Airport Shuttle', content: 'Complimentary airport shuttle runs every hour from 5 AM to 11 PM. Guests must book their seat at least 12 hours in advance.', tags: ['hotel', 'shuttle', 'airport', 'transportation'] },
            { id: 12, title: 'Hotel Check-in/Check-out Times', content: 'Standard check-in is 3:00 PM. Check-out is 11:00 AM. Late check-out up to 2:00 PM is available for a $50 fee.', tags: ['hotel', 'check-in', 'check-out', 'time', 'late'] },
            { id: 13, title: 'MRI Scan Preparation', content: 'Remove all metal objects. Inform tech of pacemakers or implants. Fasting not required unless specified for contrast.', tags: ['mri', 'scan', 'imaging', 'prep'] },
            { id: 14, title: 'Ultrasound Prep (Abdominal)', content: 'Fast for 8 hours prior. Clear liquids only if absolutely necessary.', tags: ['ultrasound', 'scan', 'abdominal', 'fasting'] },
            { id: 15, title: 'Vaccination Schedule (Infants)', content: 'First doses of HepB, Rotavirus, DTaP, Hib, PCV13, and IPV usually given at 2 months.', tags: ['vaccine', 'pediatric', 'infant', 'immunization'] },
            { id: 16, title: 'Allergy Testing Procedures', content: 'Stop antihistamines 5-7 days prior to skin prick test. Do not apply lotions to the arms or back on test day.', tags: ['allergy', 'test', 'skin prick', 'prep'] },
            { id: 17, title: 'Physical Therapy Initial Eval', content: 'Wear comfortable, loose clothing. Evaluation takes approx 60 minutes.', tags: ['pt', 'physical therapy', 'eval'] },
            { id: 18, title: 'Telehealth Connection Issues', content: 'Advise patient to restart device, check internet speed, or switch to phone audio if video fails repeatedly.', tags: ['telehealth', 'video', 'troubleshooting', 'tech support'] },
            { id: 19, title: 'Medical Records Request', content: 'Requests take up to 30 days. Valid ID and signed release form are mandatory.', tags: ['records', 'medical', 'release', 'hipaa'] },
            { id: 20, title: 'Billing Dispute Resolution', content: 'Escalate to billing department. Request itemized statement for patient review.', tags: ['billing', 'invoice', 'dispute', 'finance'] },
            { id: 21, title: 'Insurance Verification', content: 'Verify primary and secondary insurance before any specialized procedure. Get pre-auth if required.', tags: ['insurance', 'auth', 'verification'] },
            { id: 22, title: 'VIP Patient Protocol', content: 'Notify hospital director. Ensure private waiting room is prepared. Assign dedicated concierge nurse.', tags: ['vip', 'protocol', 'concierge'] },
            { id: 23, title: 'Infectious Disease Isolation', content: 'Patient with suspected airborne disease must bypass waiting room and go straight to negative pressure room.', tags: ['infection', 'isolation', 'covid', 'airborne'] },
            { id: 24, title: 'Lost Item in Hospital', content: 'Direct patient to security desk for lost & found. Log item description and contact info in portal.', tags: ['lost', 'found', 'security', 'hotel'] },
            { id: 25, title: 'Chemotherapy First Visit', content: 'Plan for 3-4 hours. Hydrate well the day before. Bring a companion if possible.', tags: ['chemo', 'oncology', 'cancer', 'prep'] },
            { id: 26, title: 'Maternity Tour Booking', content: 'Tours are held Saturdays at 10 AM. Max 2 persons per booking. Must reserve via portal.', tags: ['maternity', 'tour', 'pregnancy'] },
            { id: 27, title: 'Concussion Protocol', content: 'If patient lost consciousness, advise immediate ER visit. For mild head bumps, monitor for nausea/dizziness for 24 hours.', tags: ['concussion', 'head injury', 'er'] },
            { id: 28, title: 'Dental Emergency', content: 'Knocked-out tooth: Keep it moist (in milk or saliva) and see dentist within 30 minutes.', tags: ['dental', 'tooth', 'emergency'] },
            { id: 29, title: 'Vision Test Frequency', content: 'Recommend annual comprehensive eye exams for adults over 60 or those with diabetes.', tags: ['vision', 'eye', 'optometry', 'exam'] },
            { id: 30, title: 'Hotel Room Service Menu', content: 'Available 24/7. Late night menu (after 11 PM) is limited to cold sandwiches and snacks.', tags: ['hotel', 'room service', 'food', 'menu'] },
            { id: 31, title: 'Interpreter Services', content: 'Available in 15 languages. Request 24 hours in advance if possible. ASL available on demand via video.', tags: ['language', 'interpreter', 'translation', 'asl'] },
            { id: 32, title: 'Wheelchair Assistance', content: 'Valet staff can provide a wheelchair upon arrival. Log request in system to dispatch porter.', tags: ['wheelchair', 'mobility', 'assistance', 'valet'] },
            { id: 33, title: 'Psychiatric Crisis Line', content: 'If patient expresses self-harm intent, KEEP THEM ON THE LINE and ping supervisor immediately to dispatch services.', tags: ['crisis', 'psychiatry', 'emergency', 'suicide'] },
            { id: 34, title: 'Visitor Hours', content: 'General wards: 10 AM to 8 PM. ICU: Immediate family only, 15 min max per hour.', tags: ['visitor', 'hours', 'icu', 'ward'] },
            { id: 35, title: 'Cafeteria Hours', content: 'Main cafeteria open 6 AM to 9 PM. Vending machines available 24/7 on the 2nd floor.', tags: ['cafeteria', 'food', 'dining'] },
            { id: 36, title: 'Lab Results Turnaround', content: 'Routine blood work: 24-48 hours. Cultures: 3-5 days. Biopsies: 7-10 days.', tags: ['lab', 'results', 'blood', 'turnaround'] },
            { id: 37, title: 'Needlestick Injury (Staff)', content: 'Wash immediately with soap and water. Report to Occupational Health within 1 hour.', tags: ['needlestick', 'injury', 'staff', 'occupational health'] },
            { id: 38, title: 'Fire Alarm Protocol', content: 'Do not use elevators. Staff to close all patient doors. Evacuate only if ordered by Fire Marshal.', tags: ['fire', 'alarm', 'emergency', 'evacuation'] },
            { id: 39, title: 'Code Blue Defintion', content: 'Medical emergency: adult cardiac or respiratory arrest. Dial 99 immediately.', tags: ['code blue', 'cardiac', 'emergency', 'arrest'] },
            { id: 40, title: 'Outpatient Pharmacy Hours', content: 'Monday to Friday: 8 AM to 6 PM. Closed weekends and major holidays.', tags: ['pharmacy', 'hours', 'outpatient'] },
            { id: 41, title: 'Grievance Filing', content: 'Patients can file a grievance online or request a physical form from the nursing station. Patient Advocate responds within 48h.', tags: ['grievance', 'complaint', 'advocate'] },
            { id: 42, title: 'Service Animal Policy', content: 'Dogs and miniature horses recognized by ADA are permitted. Emotional support animals are NOT allowed in clinical areas.', tags: ['animal', 'service', 'pet', 'ada'] },
            { id: 43, title: 'Patient Portal Password Reset', content: 'Send reset link via email. If email inaccessible, verify identity via phone and generate temporary pin.', tags: ['password', 'portal', 'reset', 'login'] },
            { id: 44, title: 'X-Ray Walk-in Hours', content: 'Walk-ins accepted M-F 9 AM to 4 PM. Must have physical order form from referring physician.', tags: ['xray', 'imaging', 'walk-in'] },
            { id: 45, title: 'Sleep Study Guidelines', content: 'Arrive at 8 PM. Bring comfortable sleepwear. Avoid caffeine after noon on the day of the study.', tags: ['sleep', 'study', 'apnea', 'prep'] },
            { id: 46, title: 'Discharge Process', content: 'Requires physician sign-off, pharmacy consult, and finalized transport arrangements. Target time is 11 AM.', tags: ['discharge', 'process', 'leaving'] },
            { id: 47, title: 'Second Opinion Consults', content: 'Requires referral and transfer of existing records. Not covered by all HMO plans without pre-auth.', tags: ['second opinion', 'consult', 'referral'] },
            { id: 48, title: 'Endoscopy Prep', content: 'Strict clear liquid diet 24 hours prior. Take prep solution as directed. Must have a driver to go home.', tags: ['endoscopy', 'gi', 'prep', 'diet'] },
            { id: 49, title: 'Valet Parking Rates', content: 'First hour: $5. Daily max: $25. Free for VIPs and oncology patients with validated ticket.', tags: ['parking', 'valet', 'fee', 'transport'] },
            { id: 50, title: 'Spiritual Care Services', content: 'Chaplains available 24/7. Non-denominational chapel located on 1st floor near main entrance.', tags: ['spiritual', 'chaplain', 'religion', 'care'] },
            { id: 51, title: 'Blood Donation Drive', content: 'Held every first Tuesday of the month in the main lobby. Walk-ins welcome. Get free juice and cookies.', tags: ['blood', 'donation', 'drive'] },
            { id: 52, title: 'Code Pink Definition', content: 'Suspected infant or child abduction. All staff must monitor exits immediately.', tags: ['code pink', 'abduction', 'emergency', 'child'] }
        ].filter(r => r.title.toLowerCase().includes(req.query.q.toLowerCase()) || r.tags.some(tag => tag.toLowerCase().includes(req.query.q.toLowerCase()))));
    }
});

module.exports = router;
