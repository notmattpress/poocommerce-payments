/** @format **/

/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { CollapsibleList, TaskItem } from '@poocommerce/experimental';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TIME } from 'wcpay/constants/time';
import { saveOption } from 'wcpay/data/settings/actions';

const TaskList = ( { overviewTasksVisibility, tasks } ) => {
	const { createNotice } = useDispatch( 'core/notices' );
	const [ visibleTasks, setVisibleTasks ] = useState( tasks );
	const {
		deletedTodoTasks,
		dismissedTodoTasks,
		remindMeLaterTodoTasks,
	} = overviewTasksVisibility;

	const getVisibleTasks = useCallback( () => {
		const nowTimestamp = Date.now();
		return tasks.filter(
			( task ) =>
				! deletedTodoTasks.includes( task.key ) &&
				! dismissedTodoTasks.includes( task.key ) &&
				( ! remindMeLaterTodoTasks[ task.key ] ||
					remindMeLaterTodoTasks[ task.key ] < nowTimestamp )
		);
	}, [
		deletedTodoTasks,
		dismissedTodoTasks,
		remindMeLaterTodoTasks,
		tasks,
	] );

	useEffect( () => {
		setVisibleTasks( getVisibleTasks() );
	}, [ tasks, getVisibleTasks ] );

	const undoDismissTask = async ( key, dismissedTasks, optionName ) => {
		const updatedDismissedTasks = dismissedTasks.filter(
			( task ) => task !== key
		);

		dismissedTasks.splice( dismissedTodoTasks.indexOf( key ), 1 );
		setVisibleTasks( getVisibleTasks() );

		saveOption( optionName, updatedDismissedTasks );
	};

	const dismissSelectedTask = async ( {
		task,
		dismissedTasks,
		noticeMessage,
		optionName,
	} ) => {
		const { key, onDismiss } = task;

		dismissedTasks.push( key );
		setVisibleTasks( getVisibleTasks() );

		saveOption( optionName, [ ...dismissedTasks ] );

		createNotice( 'success', noticeMessage, {
			actions: [
				{
					label: __( 'Undo', 'poocommerce-payments' ),
					onClick: () =>
						undoDismissTask( key, dismissedTasks, optionName ),
				},
			],
		} );
		if ( onDismiss ) {
			onDismiss();
		}
	};

	const dismissTask = ( task, type ) => {
		const params =
			type === 'dismiss'
				? {
						task,
						dismissedTasks: dismissedTodoTasks,
						noticeMessage: __(
							'Task dismissed',
							'poocommerce-payments'
						),
						optionName: 'poocommerce_dismissed_todo_tasks',
				  }
				: {
						task,
						dismissedTasks: deletedTodoTasks,
						noticeMessage: __(
							'Task deleted',
							'poocommerce-payments'
						),
						optionName: 'poocommerce_deleted_todo_tasks',
				  };
		dismissSelectedTask( params );
	};

	const undoRemindTaskLater = async ( key ) => {
		const {
			// eslint-disable-next-line no-unused-vars
			[ key ]: oldValue,
			...updatedRemindMeLaterTasks
		} = remindMeLaterTodoTasks;

		delete remindMeLaterTodoTasks[ key ];
		setVisibleTasks( getVisibleTasks() );

		saveOption(
			'poocommerce_remind_me_later_todo_tasks',
			updatedRemindMeLaterTasks
		);
	};

	const remindTaskLater = async ( { key, onDismiss } ) => {
		const dismissTime = Date.now() + TIME.DAY_IN_MS;
		remindMeLaterTodoTasks[ key ] = dismissTime;
		setVisibleTasks( getVisibleTasks() );

		saveOption( 'poocommerce_remind_me_later_todo_tasks', {
			...remindMeLaterTodoTasks,
			[ key ]: dismissTime,
		} );

		createNotice(
			'success',
			__( 'Task postponed until tomorrow', 'poocommerce-payments' ),
			{
				actions: [
					{
						label: __( 'Undo', 'poocommerce-payments' ),
						onClick: () => undoRemindTaskLater( key ),
					},
				],
			}
		);
		if ( onDismiss ) {
			onDismiss();
		}
	};

	if ( ! visibleTasks.length ) {
		return <div></div>;
	}

	return (
		<CollapsibleList
			className={ 'wcpay-task-list' }
			collapsed={ false }
			show={ 5 }
			collapseLabel={ __( 'Hide tasks', 'poocommerce-payments' ) }
			expandLabel={ __( 'Show tasks', 'poocommerce-payments' ) }
		>
			{ visibleTasks.map( ( task ) => (
				<TaskItem
					key={ task.key }
					data-key={ task.key }
					// Pass in optional data attributes.
					{ ...( task.dataAttrs || {} ) }
					title={ task.title }
					actionLabel={ task.actionLabel }
					completed={ task.completed }
					content={ task.content }
					additionalInfo={ task.additionalInfo }
					showActionButton={ task.showActionButton }
					expandable={ task.expandable }
					expanded={ task.expanded }
					enter={ task.enter !== undefined ? task.enter : false }
					action={
						task.action !== undefined ? task.action : task.onClick
					}
					onClick={ task.onClick }
					time={ task.time }
					level={ task.level }
					onDelete={
						task.isDeletable && task.completed
							? () => dismissTask( task, 'delete' )
							: undefined
					}
					onDismiss={
						task.isDismissable
							? () => dismissTask( task, 'dismiss' )
							: undefined
					}
					onSnooze={
						task.allowSnooze
							? () => remindTaskLater( task )
							: undefined
					}
				/>
			) ) }
		</CollapsibleList>
	);
};

export default TaskList;
