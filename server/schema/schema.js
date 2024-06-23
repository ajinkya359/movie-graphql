const graphql = require('graphql')
const axios = require('axios');
const movies = require('../models/movies');
const lists = require('../models/lists');




const{GraphQLEnumType, GraphQLString, GraphQLInt,GraphQLObjectType, GraphQLList,GraphQLNonNull,GraphQLID} = graphql;

const MovieType = new GraphQLObjectType({
    name:"Movie",
    fields:()=>({
        id:{
            type : GraphQLString
        },
        title:{
            type : GraphQLString,
            async resolve(parent,args){
                const res = await axios.get(`https://api.themoviedb.org/3/movie/${parent.id}?language=en-US&api_key=${api_key}`)
                // console.log(res.data.genres)
                return res.data.title   
            }
        },  
        genres:{
            type:new GraphQLList(GenreType),
            async resolve(parent,args){
                const res = await axios.get(`https://api.themoviedb.org/3/movie/${parent.id}?language=en-US&api_key=${api_key}`)
                // console.log(res.data.genres)
                return res.data.genres
            }
        },
        cast:{
            type : new GraphQLList(PersonType),
            async resolve(parent,args){
                const res = await axios.get(`https://api.themoviedb.org/3/movie/${parent.id}/credits?api_key=${api_key}`)
                // console.log(res.data.cast)
                return res.data.cast
            }
        }
    })
})

const GenderEnum = new GraphQLEnumType({
    name:"Gender",
    values : {
        NotSpecified:{
            value:0
        },
        Female : {

            value:1
        },
        Male : {
            value:2
        },
        NonBinary:{
            value:3
        }

    }
     
})

const PersonType = new GraphQLObjectType({
    name:"Person",
    fields : () => ({
        id:{
            type : new GraphQLNonNull(GraphQLID)
        },
        name:{
            type : new GraphQLNonNull(GraphQLString)
        },
        gender:{
            type : new GraphQLNonNull(GenderEnum)
        },
        movies:{
            type : new GraphQLList(MovieType),
            async resolve(parent,args){
                // console.log(parent.id)
                const res = await axios.get(`https://api.themoviedb.org/3/person/${parent.id}/movie_credits?api_key=${api_key}`)
                // console.log(res.data.cast)
                return res.data.cast
            }
        }
    })
})

const ListType = new GraphQLObjectType({
    name:"List",
    fields:()=>({
        id:{
            type:GraphQLID
        },
        name:{
            type:GraphQLString
        }
    })
})

const GenreType = new GraphQLObjectType({
    name: "Genre",
    fields : ()=>({
        id:{
            type: GraphQLInt
        },
        name:{
            type:GraphQLString
        },
        movies:{
            type : new GraphQLList(MovieType),
            async resolve(parent,args){
                const res = await axios.get(`https://api.themoviedb.org/3/discover/movie?with_genres=${parent.id}&api_key=${api_key}`)
                // console.log(res.data.results)
                return res.data.results
            }
        }
    })
})

const getAllGenres = async () =>{
    const res = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?language=en&api_key=${api_key}`)
    return res.data.genres
}

const RootQuery = new GraphQLObjectType({
    name: "Query",
    fields:()=>({
        popular_movies:{
            type : new GraphQLList(MovieType),
            async resolve(parent,args){
                const res = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${api_key}`)
                return res.data.results
            }
        },
        movie:{
            type: new GraphQLList(MovieType),
            args:{id:{type:GraphQLID},name:{type:GraphQLString}},
            async resolve(parent,args){
                if(args.id !== undefined){
                    const res = await axios.get(`https://api.themoviedb.org/3/movie/${args.id}?language=en-US&api_key=${api_key}`)
                    return [res.data]    
                }
                if(args.name!==undefined){
                    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?query=${args.name}&api_key=${api_key}`)
                    return res.data.results
                }
            }
        },
        genres:{
            type : new GraphQLList(GenreType),
            async resolve(parent,args){
                return await getAllGenres()
            
            }
        },
        genre:{
            type:GenreType,
            args:{id:{type:new GraphQLNonNull(GraphQLID)}},
            async resolve(parent,args){
                const res = await getAllGenres();
                const ans = await res.filter(curr => curr.id == args.id )
                return ans[0]
            }
        },
        person:{
            type:new GraphQLList(PersonType),
            args:{id:{type:GraphQLInt}, name : {type:GraphQLString}},
            async resolve(parent,args){
                if(args.id!==undefined)
                {
                    const res = await axios.get(`https://api.themoviedb.org/3/person/${args.id}?language=en-US7&api_key=${api_key}`)
                    return  [res.data]
                }
                if(args.name!=undefined){
                    const res = await axios.get(`https://api.themoviedb.org/3/search/person?query=${args.name}&api_key=${api_key}`)
                    return  res.data.results
                }
            }
        },
        lists:{
            type: new GraphQLList(ListType),
            async resolve(parent,args){
                const res = await lists.find({})
                return res
            }
        },
        myList:{
            type : new GraphQLList(MovieType),
            args:{id:{type:new GraphQLNonNull(GraphQLID)}},
            async resolve(parent,args){
                const res = await movies.find({list_id:args.id})
                return res
            }
        }
    })
})



const Mutation = new GraphQLObjectType({
    name:"Mutation",
    fields:{
        addMovie:{
            type:MovieType,
            args:{
                movie_id : {type : new GraphQLNonNull(GraphQLID)},
                list_id : {type : new GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent,args){
                const list = await lists.find({_id:args.list_id})
                // console.log("list", list)
                if(list === null) {
                    console.log("No such list exists")
                    return "No such list"
                }
                const contains = await movies.find({id:args.movie_id,list_id:args.list_id})
                console.log("contains Length",contains.length)
                if(contains!==null && contains.length!==0) {
                    console.log("Already such pair exists")
                    return
                }
                const res = new movies({
                    id:args.movie_id,
                    list_id:args.list_id
                })
                return await res.save()
            }
        },
        addList:{
            type:ListType,
            args:{name:{type:new GraphQLNonNull(GraphQLString)}},
            async resolve(parent,args){
                const res = new lists({
                    name:args.name
                })
                return await res.save()
            }
        },
        deleteMovie:{
            type:GraphQLString,
            args:{
                list_id:{type:new GraphQLNonNull(GraphQLID)},
                movie_id:{type:new GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent,args){
                const res1 = await movies.find({id:args.movie_id,list_id:args.list_id})  
                if(res1.length === 0) return "No such Movie exist in the list."
                await movies.deleteOne({id:args.movie_id,list_id:args.list_id})
                return "Success"
            }
        }
        ,
        deleteList:{
            type:GraphQLString,
            args:{
                list_id: {type:new GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent,args){
                await lists.deleteOne({_id:args.list_id});
                await movies.deleteMany({list_id:args.list_id})
                return "Done"
            }
        }
    }
})

module.exports = new graphql.GraphQLSchema({
    query : RootQuery,
    mutation:Mutation
})