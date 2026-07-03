exports.analyzeSymptoms = async (req, res) => {
    try {
        const { symptoms, agentName } = req.body;
        
        if (!symptoms || symptoms.trim().length === 0) {
            return res.status(200).json({ success: true, data: null });
        }

        const text = symptoms.toLowerCase();
        
        let priority = 'GREEN';
        let department = 'General Practice';
        let isEmergency = false;

        // Simulated NLP Keyword Engine
        const redKeywords = ['chest pain', 'heart attack', 'stroke', 'unconscious', 'bleeding heavily', 'seizure', 'cannot breathe', 'choking', 'blood loss', 'accident', 'crash', 'trauma', 'amputation', 'gunshot', 'stab'];
        const yellowKeywords = ['fracture', 'broken bone', 'fever over 103', 'severe pain', 'head injury', 'dizzy', 'fainting', 'deep cut', 'concussion', 'burn'];
        
        const orthoKeywords = ['fracture', 'broken bone', 'joint', 'knee', 'back pain', 'spine', 'bone'];
        const cardioKeywords = ['chest pain', 'heart', 'palpitations', 'blood pressure', 'cardiac'];
        const neuroKeywords = ['stroke', 'seizure', 'head injury', 'dizzy', 'migraine', 'fainting', 'concussion'];
        const pulmoKeywords = ['cannot breathe', 'asthma', 'coughing blood', 'choking', 'breath'];
        const traumaKeywords = ['accident', 'crash', 'blood loss', 'bleeding heavily', 'trauma', 'amputation', 'gunshot', 'stab', 'deep cut'];

        // Determine Department
        if (traumaKeywords.some(kw => text.includes(kw))) department = 'Emergency / Trauma';
        else if (cardioKeywords.some(kw => text.includes(kw))) department = 'Cardiology';
        else if (orthoKeywords.some(kw => text.includes(kw))) department = 'Orthopedics';
        else if (neuroKeywords.some(kw => text.includes(kw))) department = 'Neurology';
        else if (pulmoKeywords.some(kw => text.includes(kw))) department = 'Pulmonology';

        // Determine Priority
        if (redKeywords.some(kw => text.includes(kw))) {
            priority = 'RED';
            isEmergency = true;
        } else if (yellowKeywords.some(kw => text.includes(kw))) {
            priority = 'YELLOW';
        }

        // If Emergency, Emit Global WebSocket Event
        if (isEmergency) {
            const io = req.app.get('io');
            if (io) {
                io.emit('EMERGENCY_ESCALATION', {
                    symptoms: symptoms,
                    department,
                    agentName: agentName || 'Agent',
                    timestamp: new Date()
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                priority,
                department,
                isEmergency
            }
        });

    } catch (err) {
        console.error('Error analyzing symptoms:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
