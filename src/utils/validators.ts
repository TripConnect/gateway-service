import Joi from 'joi';

export const livestreamStartValidator = Joi.object({
    roomId: Joi.string()
        .uuid()
        .required(),
});

