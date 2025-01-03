/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CollapsibleList, TaskItem, Text } from '@poocommerce/experimental';
import { Badge } from '@poocommerce/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TaskList from '..';

jest.mock( '@poocommerce/experimental', () => ( {
	CollapsibleList: jest.fn(),
	TaskItem: jest.fn(),
	Text: jest.fn(),
} ) );

jest.mock( '@poocommerce/components', () => ( {
	Badge: jest.fn(),
} ) );
jest.mock( '@wordpress/data' );

useDispatch.mockReturnValue( {
	createNotice: jest.fn(),
} );

describe( 'TaskList', () => {
	const tasksMocked = {
		key: 'task-key',
		title: 'Task Title',
		completed: false,
		content: 'Task Content',
		expanded: false,
		onClick: jest.fn(),
		action: jest.fn(),
		time: 123,
		level: 1,
	};

	const getOverviewTasksVisibilityMock = () => ( {
		deletedTodoTasks: [],
		dismissedTodoTasks: [],
		remindMeLaterTodoTasks: {},
	} );

	beforeEach( () => {
		const renderNothing = () => null;

		Badge.mockImplementation( renderNothing );
		CollapsibleList.mockImplementation( ( { children } ) => (
			<div>{ children }</div>
		) );
		TaskItem.mockImplementation( ( { title } ) => <div>{ title }</div> );
		Text.mockImplementation( renderNothing );
		const createNotice = jest.fn();
		useDispatch.mockReturnValue( {
			createNotice,
		} );
	} );
	it( 'shows an incomplete task', () => {
		const overviewTasksVisibility = getOverviewTasksVisibilityMock();
		render(
			<TaskList
				tasks={ [ tasksMocked ] }
				overviewTasksVisibility={ overviewTasksVisibility }
			/>
		);

		expect( screen.queryByText( /Task Title/ ) ).toBeInTheDocument();
	} );
	it( 'does not show deleted tasks', () => {
		const overviewTasksVisibility = getOverviewTasksVisibilityMock();
		overviewTasksVisibility.deletedTodoTasks.push( 'task-key' );
		render(
			<TaskList
				tasks={ [ tasksMocked ] }
				overviewTasksVisibility={ overviewTasksVisibility }
			/>
		);
		expect( screen.queryByText( /Task Title/ ) ).not.toBeInTheDocument();
	} );
	it( 'does not show dismissed tasks', () => {
		const overviewTasksVisibility = getOverviewTasksVisibilityMock();
		overviewTasksVisibility.dismissedTodoTasks.push( 'task-key' );
		render(
			<TaskList
				tasks={ [ tasksMocked ] }
				overviewTasksVisibility={ overviewTasksVisibility }
			/>
		);
		expect( screen.queryByText( /Task Title/ ) ).not.toBeInTheDocument();
	} );
	it( 'does not show tasks before time', () => {
		const overviewTasksVisibility = getOverviewTasksVisibilityMock();
		const DAY_IN_MS = 24 * 60 * 60 * 1000;
		const dismissTime = Date.now() + DAY_IN_MS;

		overviewTasksVisibility.remindMeLaterTodoTasks = {
			'task-key': dismissTime,
		};

		render(
			<TaskList
				tasks={ [ tasksMocked ] }
				overviewTasksVisibility={ overviewTasksVisibility }
			/>
		);
		expect( screen.queryByText( /Task Title/ ) ).not.toBeInTheDocument();
	} );
	it( 'shows snoozed tasks after one day', () => {
		const overviewTasksVisibility = getOverviewTasksVisibilityMock();
		const DAY_IN_MS = 24 * 60 * 60 * 1000;
		const dismissTime = Date.now() - DAY_IN_MS;

		overviewTasksVisibility.remindMeLaterTodoTasks = {
			'task-key': dismissTime,
		};

		render(
			<TaskList
				tasks={ [ tasksMocked ] }
				overviewTasksVisibility={ overviewTasksVisibility }
			/>
		);
		expect( screen.queryByText( /Task Title/ ) ).toBeInTheDocument();
	} );
} );
