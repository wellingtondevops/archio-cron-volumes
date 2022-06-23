import * as mongoose from 'mongoose';
import { User } from '../users/users.model'


export interface Template extends mongoose.Document {
    classes: any;

    
    structureName: string,
    author: mongoose.Types.ObjectId | User,
    mailSignup: string,
    dateCreated: Date,
}

const TemplateSchema = new mongoose.Schema({

    structureName: {
        type: String,
        required: true,
        trim: true,

    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    mailSignup: {
        type: String,
        required: false,
        trim: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },

    classes: [
        {
            codTopic: {
                type: String,
                length: 10,
                trim: true

            },
            topic: {
                type: String,
                trim: true,

            },
            currentLabel: {
                type: String,
                trim: true,
                

            },
            currentValue: {
                type: Number,
                defaul:0

            },
            intermediateLabel: {
                type: String,
                trim: true
            },
            intermediateValue: {
                type: Number,
                defaul:0

            },
            final: {
                type: String,
                trim: true,

            },
            comments: {
                type: String,
                trim: true,

            },
            subclasses: [
                {
                    codTopic: {
                        type: String,
                        length: 10,
                        trim: true,

                    },
                    topic: {
                        type: String,
                        trim: true,

                    },
                    currentLabel: {
                        type: String,
                        trim: true,

                    },
                    currentValue: {
                        type: Number,
                        defaul:0

                    },
                    intermediateLabel: {
                        type: String,
                        trim: true
                    },
                    intermediateValue: {
                        type: Number,
                        defaul:0

                    },
                    final: {
                        type: String,
                        trim: true,

                    },
                    comments: {
                        type: String,
                        trim: true,

                    },
                    groups: [
                        {
                            codTopic: {
                                type: String,
                                length: 10,
                                trim: true,

                            },
                            topic: {
                                type: String,
                                trim: true,

                            },
                            currentLabel: {
                                type: String,
                                trim: true,

                            },
                            currentValue: {
                                type: Number,
                                defaul:0

                            },
                            intermediateLabel: {
                                type: String,
                                trim: true
                            },
                            intermediateValue: {
                                type: Number,
                                defaul:0

                            },
                            final: {
                                type: String,
                                trim: true,

                            },
                            comments: {
                                type: String,
                                trim: true,

                            },
                            subgroups: [
                                {
                                    codTopic: {
                                        type: String,
                                        length: 10,
                                        trim: true,

                                    },
                                    topic: {
                                        type: String,
                                        trim: true,

                                    },
                                    currentLabel: {
                                        type: String,
                                        trim: true,

                                    },
                                    currentValue: {
                                        type: Number,
                                        defaul:0

                                    },
                                    intermediateLabel: {
                                        type: String,
                                        trim: true
                                    },
                                    intermediateValue: {
                                        type: Number,
                                        defaul:0
                                        

                                    },
                                    final: {
                                        type: String,
                                        trim: true,

                                    },
                                    comments: {
                                        type: String,
                                        trim: true,

                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]


})




export const Template = mongoose.model<Template>('Template', TemplateSchema)
