// import * as express from 'express';
// import { ObjectId } from 'mongodb';
// import { Event } from '../models/event';
// import { Member } from '../models/member';
// import { successRes, errorRes } from '../utils';
// export const router = express.Router();

// // Creates an object with keys = 'month/year' and value = # with said date
// const formatDates = (r: any[]): object =>
// 	// prettier-ignore
// 	r.reduce((dates, date) => (
// 		{...dates, [`${date._id.month < 10 ? '0' : ''}${date._id.month}/${date._id.year}`]: date.count}
// 	), {});

// router.get('/members', async (req, res, next) => {
// 	try {
// 		const freshmanGraduationYear =
// 			new Date().getMonth() > 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();
// 		const sophomoreGraduationYear = freshmanGraduationYear + 1;
// 		const juniorGraduationYear = sophomoreGraduationYear + 1;
// 		const seniorGraduationYear = juniorGraduationYear + 1;

// 		const {
// 			majors,
// 			grades,
// 			membersEventAttendance,
// 			numNewMembersPerMonth,
// 			numMembersPerMonth,
// 			eventAttendancePerMonth
// 		} = await Promise.all([
// 			Member.aggregate([
// 				{
// 					$facet: {
// 						// Creates an array of objects with
// 						// (_id = major && count = # people with that major)
// 						majors: [{ $match: { major: { $ne: null } } }, { $sortByCount: '$major' }],

// 						// Creates an array of objects with
// 						// (_id = graduation year && count = # people with that graduation year)
// 						grades: [
// 							{
// 								$match: {
// 									graduationYear: {
// 										$in: [
// 											freshmanGraduationYear,
// 											sophomoreGraduationYear,
// 											juniorGraduationYear,
// 											seniorGraduationYear
// 										]
// 									}
// 								}
// 							},
// 							{ $group: { _id: '$graduationYear', count: { $sum: 1 } } },
// 							{ $sort: { _id: -1 } }
// 						],

// 						// Creates an array of objects with
// 						// (_id = { month: monthJoined, year: yearJoined} && count = # people that joined on that date)
// 						numNewMembersPerMonth: [
// 							{
// 								// create month and year fields to sort with
// 								$addFields: {
// 									month: { $month: '$createdAt' },
// 									year: { $year: '$createdAt' }
// 								}
// 							},
// 							{
// 								$group: {
// 									_id: { month: '$month', year: '$year' },
// 									count: { $sum: 1 }
// 								}
// 							},
// 							// sort from oldest to newest
// 							{ $sort: { '_id.year': 1, '_id.month': 1 } }
// 						],

// 						// Creates an array of objects with
// 						// (_id = # events attended && count = # people that attended that many events)
// 						membersEventAttendance: [
// 							{ $match: { events: { $ne: null } } },
// 							{
// 								$group: { _id: { $size: '$events' }, count: { $sum: 1 } }
// 							},
// 							{ $sort: { _id: 1 } }
// 						]
// 					}
// 				}
// 			])
// 				.exec()
// 				.then(result => {
// 					// turns the resulting array into an object;
// 					result = { ...result[0] };

// 					// Creates the numMembersPerMonth field by setting each date count = sum of date counts prior
// 					// prettier-ignore
// 					result.numMembersPerMonth = result.numNewMembersPerMonth
// 						.map(dateData => dateData = { ...dateData })
// 						.map((dateData, index, arrayOfDates) => {
// 							if (index !== 0) dateData.count += arrayOfDates[index - 1].count;

// 							return dateData;
// 						});

// 					// Creates an object with keys = major, and value = # people in said major
// 					// prettier-ignore

// 					result.majors = result.majors.reduce((majorData, majorAggregationResult) => {
// 						const individualWords = majorAggregationResult._id.split(" ");
// 						let majorName = "";

// 						if (individualWords.length >= 2) {
// 							for (const word of individualWords) {
// 								majorName += word[0];
// 							}
// 						} else {
// 							majorName = majorAggregationResult._id
// 						}

// 						return {...majorData, [majorName]: majorAggregationResult.count}
// 					}, {});

// 					// Creates an object with keys = grade, and value = # people in said grade
// 					// prettier-ignore
// 					result.grades = result.grades.reduce((gradeData, gradeAggregationResult) => (
// 						{...gradeData, [gradeAggregationResult._id]: gradeAggregationResult.count}
// 					), {});

// 					result.numNewMembersPerMonth = formatDates(result.numNewMembersPerMonth);
// 					result.numMembersPerMonth = formatDates(result.numMembersPerMonth);

// 					// Creates an object with keys = # events attended, and value = # people who attended said # events

// 					result.membersEventAttendance = result.membersEventAttendance.reduce(
// 						(membersEventAttendanceData, membersEventAttendanceAggregationResult) => ({
// 							...membersEventAttendanceData,
// 							[membersEventAttendanceAggregationResult._id]:
// 								membersEventAttendanceAggregationResult.count
// 						}),
// 						{}
// 					);

// 					return result;
// 				}),
// 			// Gets event attendance per month
// 			Event.aggregate([
// 				// Creates an object with
// 				// (_id = { month, year} && count = event attendance for said month
// 				{ $match: { members: { $ne: null } } },
// 				{
// 					$addFields: {
// 						month: { $month: '$eventTime' },
// 						year: { $year: '$eventTime' },
// 						numMembersThatAttended: { $size: '$members' }
// 					}
// 				},
// 				{
// 					$group: {
// 						_id: { month: '$month', year: '$year' },
// 						count: { $sum: '$numMembersThatAttended' }
// 					}
// 				},
// 				// sort from oldest to newest
// 				{ $sort: { '_id.year': 1, '_id.month': 1 } }
// 			])
// 				.exec()
// 				// sets result to be an object with a key so that it matches the
// 				// format of the members aggregation result
// 				.then(result => (result = { eventAttendancePerMonth: formatDates(result) }))
// 		]).then(data =>
// 			// combines the eventAggregationResult and memberAggregationResult into one object
// 			// prettier-ignore
// 			data.reduce((allResults, individualPromiseResult) => ({
// 				...allResults,
// 				...individualPromiseResult
// 			}), {})
// 		);

// 		return successRes(res, {
// 			majors,
// 			grades,
// 			membersEventAttendance,
// 			numNewMembersPerMonth,
// 			numMembersPerMonth,
// 			eventAttendancePerMonth
// 		});
// 	} catch (error) {
// 		console.error(error);
// 		return errorRes(res, 500, error);
// 	}
// });

// router.get('/event/:id', async (req, res, next) => {
// 	try {
// 		// Get individual event
// 		if (!ObjectId.isValid(req.params.id)) return errorRes(res, 400, 'Invalid event ID');

// 		const [event, eventsBeforeIds] = await Promise.all([
// 			Event.findById(req.params.id)
// 				.populate({
// 					path: 'members',
// 					model: Member
// 				})
// 				.exec(),
// 			Event.find({}, '_id eventTime').exec()
// 		]).then((result: any) => [
// 			result[0],
// 			result[1]
// 				.filter(eventIdAndTime => eventIdAndTime.eventTime < result[0].eventTime)
// 				.reduce(
// 					(eventsBeforeIdsArray, eventsBeforeIdandTime) => [
// 						...eventsBeforeIdsArray,
// 						eventsBeforeIdandTime._id
// 					],
// 					[]
// 				)
// 		]);

// 		const freshmanGraduationYear =
// 			new Date().getMonth() > 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();
// 		const sophomoreGraduationYear = freshmanGraduationYear + 1;
// 		const juniorGraduationYear = sophomoreGraduationYear + 1;
// 		const seniorGraduationYear = juniorGraduationYear + 1;

// 		const {
// 			majors,
// 			grades,
// 			membersEventAttendancePriorToTheEvent,
// 			membersCurrentEventAttendance
// 		} = await Member.aggregate([
// 			{
// 				$facet: {
// 					majors: [
// 						{ $match: { _id: { $in: event.members }, major: { $ne: null } } },
// 						{ $sortByCount: '$major' }
// 					],
// 					grades: [
// 						{
// 							$match: {
// 								_id: { $in: event.members },
// 								graduationYear: {
// 									$in: [
// 										freshmanGraduationYear,
// 										sophomoreGraduationYear,
// 										juniorGraduationYear,
// 										seniorGraduationYear
// 									]
// 								}
// 							}
// 						},
// 						{ $group: { _id: '$graduationYear', count: { $sum: 1 } } },
// 						{ $sort: { _id: 1 } }
// 					],
// 					membersEventAttendancePriorToTheEvent: [
// 						// matches members who attended the event
// 						{ $match: { _id: { $in: event.members } } },
// 						{
// 							$addFields: {
// 								numEvents: {
// 									// gets the number of events attended prior to the event
// 									$size: {
// 										$filter: {
// 											input: '$events',
// 											as: 'id',
// 											cond: { $in: ['$$id', eventsBeforeIds] }
// 										}
// 									}
// 								}
// 							}
// 						},
// 						{ $group: { _id: '$numEvents', count: { $sum: 1 } } },
// 						{ $sort: { _id: 1 } }
// 					],
// 					membersCurrentEventAttendance: [
// 						{ $match: { _id: { $in: event.members } } },
// 						{ $group: { _id: { $size: '$events' }, count: { $sum: 1 } } },
// 						{ $sort: { _id: 1 } }
// 					]
// 				}
// 			}
// 		])
// 			.exec()
// 			.then(result => {
// 				// turns the resulting array into an object;
// 				result = { ...result[0] };

// 				// Creates an object with keys = major, and value = # people in said major
// 				result.majors = result.majors.reduce((majorData, majorAggregationResult) => {
// 					const individualWords = majorAggregationResult._id.split(' ');
// 					let majorName = '';

// 					if (individualWords.length >= 2) {
// 						for (const word of individualWords) {
// 							majorName += word[0];
// 						}
// 					} else {
// 						majorName = majorAggregationResult._id;
// 					}

// 					return { ...majorData, [majorName]: majorAggregationResult.count };
// 				}, {});

// 				// Creates an object with keys = grade, and value = # people in said grade
// 				result.grades = result.grades.reduce(
// 					(gradeData, gradeAggregationResult) => ({
// 						...gradeData,
// 						[gradeAggregationResult._id]: gradeAggregationResult.count
// 					}),
// 					{}
// 				);

// 				// Creates an object with keys = # events attended, and value = # people who attended said # events
// 				result.membersEventAttendancePriorToTheEvent = result.membersEventAttendancePriorToTheEvent.reduce(
// 					(
// 						membersEventAttendancePriorToTheEventData,
// 						membersEventAttendancePriorToTheEventAggregationResult
// 					) => ({
// 						...membersEventAttendancePriorToTheEventData,
// 						[membersEventAttendancePriorToTheEventAggregationResult._id]:
// 							membersEventAttendancePriorToTheEventAggregationResult.count
// 					}),
// 					{}
// 				);

// 				result.membersCurrentEventAttendance = result.membersCurrentEventAttendance.reduce(
// 					(
// 						membersCurrentEventAttendanceData,
// 						membersCurrentEventAttendanceAggregationResult
// 					) => ({
// 						...membersCurrentEventAttendanceData,
// 						[membersCurrentEventAttendanceAggregationResult._id]:
// 							membersCurrentEventAttendanceAggregationResult.count
// 					}),
// 					{}
// 				);

// 				return result;
// 			});

// 		return successRes(res, {
// 			eventName: event.name,
// 			majors,
// 			grades,
// 			membersEventAttendancePriorToTheEvent,
// 			membersCurrentEventAttendance
// 		});
// 	} catch (error) {
// 		console.log(error);
// 		return errorRes(res, 500, error);
// 	}
// });
