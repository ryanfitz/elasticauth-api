
SRC = $(shell find lib -name "*.js" -type f | sort)
TESTSRC = $(shell find test -name "*.js" -type f | sort)

default: test

lint: $(SRC) $(TESTSRC)
	@node_modules/.bin/jshint --reporter node_modules/jshint-stylish/stylish.js $^
test: lint
	@node node_modules/lab/bin/lab -a code
test-cov:
	@node node_modules/lab/bin/lab -a code -t 100
test-cov-html:
	@node node_modules/lab/bin/lab -a code -r html -o coverage.html
example:
	@node example/index.js | ./node_modules/.bin/bunyan

.PHONY: test test-cov test-cov-html example
