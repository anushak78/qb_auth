module.exports = {
	development: {

		//url: 'postgres://qba:qba@172.25.18.160:5432/qba_author',
		// url: 'postgres://qba:qba@172.25.11.103:5432/qba_author',
		url: 'postgres://qba:qba@127.0.0.1:5432/qba',

		dialect: 'postgres',
		logging: false
	},
	production: {
		url: process.env.DATABASE_URL,
		dialect: 'postgres'
	},
	staging: {
		url: process.env.DATABASE_URL,
		dialect: 'postgres'
	},
	test: {
		url: process.env.DATABASE_URL || 'postgres://qba:qba@localhost:5432/qba',
		dialect: 'postgres'
	}
};
