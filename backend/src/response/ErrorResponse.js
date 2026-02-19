export default class ErrorResponse {
    constructor(error,statusCode) {
        this.error = error;
        this.status = statusCode;
    }
}
