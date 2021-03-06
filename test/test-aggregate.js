import { assert } from 'chai';
import { validate } from './utils';
import p4 from '../';
import p3 from 'p3';

export default function({
    data,
    schema,
    precision
}) {
    let db = p4.cstore();
    db.import({
        data: data,
        schema: schema
    });

    let config = {
        container: "p4",
        viewport: [800, 450]
    };

    let views = [
        {
            id: 'v1', width: 800, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 0]
        }
    ];

    let groupByInteger = [
        {
            $aggregate: {
                $group: ['MotherAge'],
                $reduce: {
                    maxMotherWeight: {$max: 'MotherWeight'},
                    sumWeight: {$sum: 'BabyWeight'},
                    minMotherWeight: {$min: 'MotherWeight'},
                    maxMotherWeight: {$max: 'MotherWeight'},
                    averageAge: {$avg: 'MotherAge'},
                    count: {$count: '*'}
                }
            }
        }
    ]

    let groupByCategoricalKey = [
        {
            $aggregate: {
                $group: ['MotherEdu'],
                $reduce: {
                    sumWeight: {$sum: 'BabyWeight'},
                }
            }
        }
    ]

    let groupByMultipleKeys = [
        {
            $aggregate: {
                $group: ['MotherEdu'],
                $reduce: {
                    sumWeight: {$sum: 'BabyWeight'},
                }
            }
        }
    ]

    let gpu = p4(config).data(db.data()).view(views);
    let cpu = p3.pipeline(data);
    let sortMethod = (a,b)=> a.sumWeight - b.sumWeight; //sort for comparing results
    
    describe('Aggregation', function() {
        
        describe('Group-by integer attribute', function() {
            let gpuResult = gpu.runSpec(groupByInteger).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(groupByInteger).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });

        describe('Group-by categorical attribute', function() {
            cpu = p3.pipeline(data);
            let gpuResult = gpu.runSpec(groupByCategoricalKey).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(groupByCategoricalKey).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });

        describe('Group-by multiple attributes', function() {
            cpu = p3.pipeline(data);
            let gpuResult = gpu.runSpec(groupByMultipleKeys).toJson().sort(sortMethod);
            let cpuResult = cpu.runSpec(groupByMultipleKeys).sort(sortMethod);
            console.log(gpuResult);
            console.log(cpuResult);
            it('result size should equal ' + cpuResult.length, function() {
                assert.equal(gpuResult.length, cpuResult.length);
            });
        
            it('result should be closely equal with delta = ' + precision, function() {
                validate(cpuResult, gpuResult, precision);
            });
        });
    });

}
