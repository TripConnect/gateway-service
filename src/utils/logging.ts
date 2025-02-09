import 'dotenv/config';
import winston from 'winston';
const path = require('path');

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? 'debug' : 'info',
    format: winston.format.json(),
    defaultMeta: {
        logTime: new Date().toISOString(),
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.prettyPrint(),
                winston.format.printf(
                    info => `[${info.level}] ${info.timestamp}: ${info.message}`,
                ),
            ),
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../log/gateway_service.log'),
        }),
    ]
});

export default logger;
