import jwt from 'jsonwebtoken'

const authMiddleware = (req,res,next) => {
    try {
        const token = req.cookies.token;
        const result = jwt.verify(token,process.env.JWT_SECRET);
        if(!result){
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }
        req.userId = result.userId;
        next();
    } catch (error) {
        console.log("Auth Middleware Error",error);
        return res.json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export default authMiddleware;