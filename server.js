const fastify = require('fastify')({logger: true})
const path = require('path')
const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs')
const { v4: uuidv4 } = require('uuid');



fastify.register(require('@fastify/swagger'), {
    routePrefix: '/docs',
    swagger: {
        info: {
            title: 'Test swagger',
            description: 'Testing the Fastify swagger API',
            version: '0.1.0'
        },
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        },
        host: 'localhost:3000/docs',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
            { name: 'user', description: 'User related end-points' },
            { name: 'code', description: 'Code related end-points' }
        ],
        definitions: {
            User: {
                type: 'object',
                required: ['id', 'email'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: {type: 'string', format: 'email' }
                }
            }
        },
        securityDefinitions: {
            apiKey: {
                type: 'apiKey',
                name: 'apiKey',
                in: 'header'
            }
        }
    }
})
fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/multipart'))
fastify.post('/articles', async (request, reply) => {
    try {
        const fileData = await request.file();
        const uploadsDir = path.join(__dirname, 'public');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const textFields = [];
        const images = [];
        for (const field in fileData.fields) {
            if (fileData.fields[field].filename) {
                // Field is an image file
                const file = fileData.fields[field];
                const { filename, mimeType } = file;
                const trimmedname = filename.replace(/\s+/g, '');
                let newFilename = trimmedname;
                let index = 1;

                // Check if the file already exists
                while (fs.existsSync(path.join(uploadsDir, newFilename))) {
                    const ext = path.extname(filename);
                    const name = path.basename(filename, ext);
                    newFilename = `${name}_${index}${ext}`;
                    index++;
                }

                const filePath = path.join(uploadsDir, newFilename);
                const fileBuffer = await file.toBuffer(); // Convert file data to a buffer

                fs.writeFileSync(filePath, fileBuffer);

                images.push({
                    name: field,
                    filename: newFilename,
                    path: filePath,
                    mimeType: mimeType,
                });
            } else {
                const file = fileData.fields[field];
                // Field is a text field
                textFields.push({
                    name: file.fieldname,
                    value: file.value,
                });
            }
        }
        const created_at = new Date(Date.now());
        const article = await prisma.article.create({
            data: {
                id: uuidv4(),
                title: textFields.find((field) => field.name === 'title').value,
                content: textFields.find((field) => field.name === 'content').value,
                author: textFields.find((field) => field.name === 'author').value,
                image: images[0].filename,
                created_at: created_at,
            },
        });
        reply.code(201).send(article);
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
});
fastify.post('/upload', async (request, reply) => {
    try {
        const fileData = await request.file();
        const uploadsDir = path.join(__dirname, 'public');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const textFields = [];
        const images = [];
        for (const field in fileData.fields) {
            if (fileData.fields[field].filename) {
                // Field is an image file
                const file = fileData.fields[field];
                const { filename, mimeType } = file;
                const trimmedname = filename.replace(/\s+/g, '');
                let newFilename = trimmedname;
                let index = 1;

                // Check if the file already exists
                while (fs.existsSync(path.join(uploadsDir, newFilename))) {
                    const ext = path.extname(filename);
                    const name = path.basename(filename, ext);
                    newFilename = `${name}_${index}${ext}`;
                    index++;
                }

                const filePath = path.join(uploadsDir, newFilename);
                const fileBuffer = await file.toBuffer(); // Convert file data to a buffer

                fs.writeFileSync(filePath, fileBuffer);

                images.push({
                    name: field,
                    filename: newFilename,
                    path: filePath,
                    mimeType: mimeType,
                });
            } else {
                const file = fileData.fields[field];
                // Field is a text field
                textFields.push({
                    name: file.fieldname,
                    value: file.value,
                });
            }
        }        
        
        reply.code(201).send({image:`http://34.101.92.86:3000/public/${images[0].filename}`});
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
});
fastify.get('/articles', async (request, reply) => {
    try {
        const users = await prisma.article.findMany();
        const transformedArticles = users.map((user) => {
            return {
                id: user.id,
                title: user.title,
                content: user.content,
                author: user.author,
                image: `http://34.101.92.86:3000/public/${user.image}`,
                created_at: user.created_at,
                updated_at: user.updated_at
            };
        });
        reply.send(transformedArticles);
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
})
fastify.get('/articles/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const user = await prisma.article.findUnique({
            where: {
                id: (id),
            },
        });
        const transformedArticle = {
            id: user.id,
            title: user.title,
            content: user.content,
            author: user.author,
            image: `http://34.101.92.86:3000/public/${user.image}`,
            created_at: user.created_at,
        };
        if (user) {
            reply.send(transformedArticle);
        } else {
            reply.code(404).send({ error: 'article not found' });
        }
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
});
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/', // optional: default '/'
//    constraints: { host: 'localhost' } // optional: default {}
})
fastify.delete('/articles/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const uploadsDir = path.join(__dirname, 'public');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const article = await prisma.article.findUnique({
            where: {
                id: id,
            },
        });

        if (article) {
            const filePath = path.join(uploadsDir, article.image);
            // Delete the associated image file
            if (fs.existsSync(filePath)) {
                // Delete the associated image file
                fs.unlinkSync(filePath);
            }
            // Delete the article from the database
            await prisma.article.delete({
                where: {
                    id: id,
                },
            });
            reply.send({ message: 'article deleted successfully' });// Successful deletion, no content returned
        } else {
            reply.code(404).send({ error: 'Article not found' });
        }
    } catch (error) {
        console.error(error);
        reply.code(500).send({ error: 'Internal Server Error' });
    }
});


fastify.listen(3000,'0.0.0.0', (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('Server is running on http://0.0.0.0:3000');
});
