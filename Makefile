install:
	npm ci

page-loader:
	node bin/page-loader.js -h

test:
	npm test

test-coverage:
	npm run test:coverage

lint:
	npx oxlint && npx oxfmt --ignore-path=.oxfmtignore --check

lint-fix:
	npx oxfmt --ignore-path=.oxfmtignore && npx oxlint --fix

.PHONY: install page-loader test test-coverage lint lint-fix
