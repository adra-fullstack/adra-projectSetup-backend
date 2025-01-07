const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_LIVE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then((con) => {
            console.log(`Database connected to the host : ${con.connection.host}`)
        })
        .catch((err=>{
            console.log(err)
        }))    
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = connectDatabase;