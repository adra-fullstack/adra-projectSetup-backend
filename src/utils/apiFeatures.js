class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    serach() {
        let keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        }
            : {};

        this.query.find({ ...keyword })
        return this;
    }

    filter() {
        const queryStrCopy = { ...this.queryStr };
        //before
        console.log(queryStrCopy);

        //removing fields from query
        const removeFields = ['keyword', 'limit', 'page'];
        removeFields.forEach(field => delete queryStrCopy[field]);
    
        //after
        console.log(queryStrCopy);

        let queryStr = JSON.stringify(queryStrCopy);
        queryStr = queryStr.replace(/\b(gt|lt|lte|gte|eq|ne)/g , match =>`$${match}`);

        this.query.find(JSON.parse(queryStr));

        return this;
    }

    paginate(resultPerPage){
        const currentPage = Number(this.queryStr.page);
        const skip = resultPerPage * currentPage -1;

        this.query.limit(resultPerPage).skip(skip);
        return this;
    }
}


module.exports = APIFeatures