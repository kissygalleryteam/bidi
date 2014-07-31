KISSY.add(function (S, Node,Demo) {
    var $ = Node.all;
    describe('bidi', function () {
        it('Instantiation of components',function(){
            var demo = new Demo();
            expect(S.isObject(demo)).toBe(true);
        })
    });

},{requires:['node','kg/bidi/2.0.0/']});