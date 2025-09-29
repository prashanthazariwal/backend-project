class ApiResponse{
    constructor(message, statusCode, data){
        this.message = message; 
        this.statusCode = statusCode;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    }   
}
export default ApiResponse;