class ExotelXmlGenerator {
    static generateConnectXml(webrtcEndpoint, fallbackMobile) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<Response>\n`;
        
        if (webrtcEndpoint) {
            xml += `  <Dial>\n`;
            xml += `    <Sip>${webrtcEndpoint}</Sip>\n`;
            xml += `  </Dial>\n`;
        } else if (fallbackMobile) {
            xml += `  <Dial>\n`;
            xml += `    <Number>${fallbackMobile}</Number>\n`;
            xml += `  </Dial>\n`;
        } else {
            xml += `  <Say>Sorry, all agents are currently offline. Please try again later.</Say>\n`;
        }

        xml += `</Response>`;
        return xml;
    }
}

module.exports = ExotelXmlGenerator;
