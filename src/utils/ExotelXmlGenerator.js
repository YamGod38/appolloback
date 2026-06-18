class ExotelXmlGenerator {
    static generateDialFailover(fallbackNumber) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Number>${fallbackNumber}</Number>
    </Dial>
</Response>`;
    }
}

module.exports = ExotelXmlGenerator;
