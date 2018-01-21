define(function(){
    'use strict';
    function visMap(
        $int_fieldId,
        $float_addrX,
        $float_addrY,
        $float_indexedValue0,
        $float_indexedValue1,
        $float_defaultValue,
        $float_exp
    ){
        var value;
        if(fieldId > -1) {
            var d = new Vec2();
            d = this.uVisDomains[fieldId];
            value = this.getNonIndexedData(fieldId, addrX, addrY);
            value = (value - d.x) / (d.y - d.x);
        }  else {
            value = defaultValue;
        }
        if(exp != 0.0)
            value = pow(value, exp);
        return value;
    };

    var instancedXY = {};
    instancedXY.vs  = function() {
        var i, j, posX, posY, color, alpha, width, height, size;
        var rgb = new Vec3();

        i = (this.aDataIdx+0.5) / this.uDataDim.x;
        j = (this.aDataIdy+0.5) / this.uDataDim.y;

        this.vResult = 1.0;
        if(this.uFilterFlag == 1) {
            if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                this.vResult = 0.0;
        }

        posX = this.visMap(this.uVisualEncodings[0], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
        posY = this.visMap(this.uVisualEncodings[1], i, j, this.aDataValx, this.aDataValy, 0.0,  0.0);
        color = this.visMap(this.uVisualEncodings[2], i, j, this.aDataValx, this.aDataValy, -1.0,  0.0);
        alpha = this.visMap(this.uVisualEncodings[3], i, j, this.aDataValx, this.aDataValy, this.uDefaultAlpha, 0.0);
        size = this.visMap(this.uVisualEncodings[6], i, j, this.aDataValx, this.aDataValy, -1.0,  0.0);
        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;

        rgb = (color == -1.0) ? this.uDefaultColor : texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
        // gl_PointSize = (size == -1.0) ? this.uMarkSize : size * 20.0;
        gl_PointSize = 20.0;
        this.vColorRGBA = vec4(rgb, alpha);
        gl_Position = vec4(posX, posY, 0.0, 1.0);
    };

    instancedXY.fs = function() {
        if(this.vResult == this.uVisLevel) {
            if(this.uVisShape == 1) {
                var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
                if (dist > 0.5) discard;
                var delta = 0.2;
                var alpha = this.vColorRGBA.a - smoothstep(0.45-delta, 0.45, dist);
                gl_FragColor = vec4(this.vColorRGBA.rgb, alpha);
            } else {
                gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a,  this.vColorRGBA.a);
            }
        } else {
            discard;
        }
    }

    var interleave = {};
    interleave.vs = function(){
        var i, j;
        $vec3(rgb);
        var posX, posY, size, color, alpha;
        gl_PointSize = this.uMarkSize;
        i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
        j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

        this.vResult = 1.0;
        if(this.uFilterFlag == 1) {
            if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                this.vResult = 0.0;
        }

        if(this.uVisualEncodings[0] == -1) {
            posX = this.aDataFieldId.y / float(this.uFeatureCount-1);
            posY = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
        } else {
            posY = this.aDataFieldId.y / float(this.uFeatureCount-1);
            posX = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
        }
        size = this.visMap(this.uVisualEncodings[5], i, j, i, j, 1.0,  0.0);
        color = this.visMap(this.uVisualEncodings[2], i, j, i, j, -1.0,  0.0);
        alpha = this.visMap(this.uVisualEncodings[3], i, j, i, j, this.uDefaultAlpha, 0.0);

        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;

        if(color == -1.0)
            rgb = this.uDefaultColor;
        else {
            var t = (float(this.uVisualEncodings[2] - this.uIndexCount) + j) / float(this.uFieldCount);
            var value = texture2D(this.uDataInput, vec2(i, t)).a;
            rgb = this.uColorTable[int(value)+1];
        }
            // rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;

        this.vColorRGBA = vec4(rgb*alpha, alpha);

        gl_Position = vec4(posX, posY, 0.0, 1.0);
    }

    interleave.fs = function() {
        if(this.vResult == this.uVisLevel)
            gl_FragColor = this.vColorRGBA;
        else
            discard;
    }


    return function(fxgl) {
        fxgl.subroutine('visMap', 'float', visMap);

        fxgl.program("visualize", fxgl.shader.vertex(instancedXY.vs), fxgl.shader.fragment(instancedXY.fs));
        
        fxgl.program("interleave", fxgl.shader.vertex(interleave.vs), fxgl.shader.fragment(interleave.fs));

    }
})
