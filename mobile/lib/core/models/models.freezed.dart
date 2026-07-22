// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$PaginatedResponse<T> {
  List<T> get items;
  @IntConverter()
  int get total;
  @IntConverter()
  int get skip;
  @IntConverter()
  int get limit;

  /// Create a copy of PaginatedResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $PaginatedResponseCopyWith<T, PaginatedResponse<T>> get copyWith =>
      _$PaginatedResponseCopyWithImpl<T, PaginatedResponse<T>>(
          this as PaginatedResponse<T>, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is PaginatedResponse<T> &&
            const DeepCollectionEquality().equals(other.items, items) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.skip, skip) || other.skip == skip) &&
            (identical(other.limit, limit) || other.limit == limit));
  }

  @override
  int get hashCode => Object.hash(runtimeType,
      const DeepCollectionEquality().hash(items), total, skip, limit);

  @override
  String toString() {
    return 'PaginatedResponse<$T>(items: $items, total: $total, skip: $skip, limit: $limit)';
  }
}

/// @nodoc
abstract mixin class $PaginatedResponseCopyWith<T, $Res> {
  factory $PaginatedResponseCopyWith(PaginatedResponse<T> value,
          $Res Function(PaginatedResponse<T>) _then) =
      _$PaginatedResponseCopyWithImpl;
  @useResult
  $Res call(
      {List<T> items,
      @IntConverter() int total,
      @IntConverter() int skip,
      @IntConverter() int limit});
}

/// @nodoc
class _$PaginatedResponseCopyWithImpl<T, $Res>
    implements $PaginatedResponseCopyWith<T, $Res> {
  _$PaginatedResponseCopyWithImpl(this._self, this._then);

  final PaginatedResponse<T> _self;
  final $Res Function(PaginatedResponse<T>) _then;

  /// Create a copy of PaginatedResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? items = null,
    Object? total = null,
    Object? skip = null,
    Object? limit = null,
  }) {
    return _then(_self.copyWith(
      items: null == items
          ? _self.items
          : items // ignore: cast_nullable_to_non_nullable
              as List<T>,
      total: null == total
          ? _self.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      skip: null == skip
          ? _self.skip
          : skip // ignore: cast_nullable_to_non_nullable
              as int,
      limit: null == limit
          ? _self.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// Adds pattern-matching-related methods to [PaginatedResponse].
extension PaginatedResponsePatterns<T> on PaginatedResponse<T> {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_PaginatedResponse<T> value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_PaginatedResponse<T> value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_PaginatedResponse<T> value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(List<T> items, @IntConverter() int total,
            @IntConverter() int skip, @IntConverter() int limit)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse() when $default != null:
        return $default(_that.items, _that.total, _that.skip, _that.limit);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(List<T> items, @IntConverter() int total,
            @IntConverter() int skip, @IntConverter() int limit)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse():
        return $default(_that.items, _that.total, _that.skip, _that.limit);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(List<T> items, @IntConverter() int total,
            @IntConverter() int skip, @IntConverter() int limit)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _PaginatedResponse() when $default != null:
        return $default(_that.items, _that.total, _that.skip, _that.limit);
      case _:
        return null;
    }
  }
}

/// @nodoc

class _PaginatedResponse<T> implements PaginatedResponse<T> {
  const _PaginatedResponse(
      {required final List<T> items,
      @IntConverter() required this.total,
      @IntConverter() required this.skip,
      @IntConverter() required this.limit})
      : _items = items;

  final List<T> _items;
  @override
  List<T> get items {
    if (_items is EqualUnmodifiableListView) return _items;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_items);
  }

  @override
  @IntConverter()
  final int total;
  @override
  @IntConverter()
  final int skip;
  @override
  @IntConverter()
  final int limit;

  /// Create a copy of PaginatedResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$PaginatedResponseCopyWith<T, _PaginatedResponse<T>> get copyWith =>
      __$PaginatedResponseCopyWithImpl<T, _PaginatedResponse<T>>(
          this, _$identity);

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _PaginatedResponse<T> &&
            const DeepCollectionEquality().equals(other._items, _items) &&
            (identical(other.total, total) || other.total == total) &&
            (identical(other.skip, skip) || other.skip == skip) &&
            (identical(other.limit, limit) || other.limit == limit));
  }

  @override
  int get hashCode => Object.hash(runtimeType,
      const DeepCollectionEquality().hash(_items), total, skip, limit);

  @override
  String toString() {
    return 'PaginatedResponse<$T>(items: $items, total: $total, skip: $skip, limit: $limit)';
  }
}

/// @nodoc
abstract mixin class _$PaginatedResponseCopyWith<T, $Res>
    implements $PaginatedResponseCopyWith<T, $Res> {
  factory _$PaginatedResponseCopyWith(_PaginatedResponse<T> value,
          $Res Function(_PaginatedResponse<T>) _then) =
      __$PaginatedResponseCopyWithImpl;
  @override
  @useResult
  $Res call(
      {List<T> items,
      @IntConverter() int total,
      @IntConverter() int skip,
      @IntConverter() int limit});
}

/// @nodoc
class __$PaginatedResponseCopyWithImpl<T, $Res>
    implements _$PaginatedResponseCopyWith<T, $Res> {
  __$PaginatedResponseCopyWithImpl(this._self, this._then);

  final _PaginatedResponse<T> _self;
  final $Res Function(_PaginatedResponse<T>) _then;

  /// Create a copy of PaginatedResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? items = null,
    Object? total = null,
    Object? skip = null,
    Object? limit = null,
  }) {
    return _then(_PaginatedResponse<T>(
      items: null == items
          ? _self._items
          : items // ignore: cast_nullable_to_non_nullable
              as List<T>,
      total: null == total
          ? _self.total
          : total // ignore: cast_nullable_to_non_nullable
              as int,
      skip: null == skip
          ? _self.skip
          : skip // ignore: cast_nullable_to_non_nullable
              as int,
      limit: null == limit
          ? _self.limit
          : limit // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
mixin _$Currency {
  String get code;
  String get name;
  String get symbol;

  /// Create a copy of Currency
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $CurrencyCopyWith<Currency> get copyWith =>
      _$CurrencyCopyWithImpl<Currency>(this as Currency, _$identity);

  /// Serializes this Currency to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Currency &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.symbol, symbol) || other.symbol == symbol));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, code, name, symbol);

  @override
  String toString() {
    return 'Currency(code: $code, name: $name, symbol: $symbol)';
  }
}

/// @nodoc
abstract mixin class $CurrencyCopyWith<$Res> {
  factory $CurrencyCopyWith(Currency value, $Res Function(Currency) _then) =
      _$CurrencyCopyWithImpl;
  @useResult
  $Res call({String code, String name, String symbol});
}

/// @nodoc
class _$CurrencyCopyWithImpl<$Res> implements $CurrencyCopyWith<$Res> {
  _$CurrencyCopyWithImpl(this._self, this._then);

  final Currency _self;
  final $Res Function(Currency) _then;

  /// Create a copy of Currency
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? code = null,
    Object? name = null,
    Object? symbol = null,
  }) {
    return _then(_self.copyWith(
      code: null == code
          ? _self.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _self.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// Adds pattern-matching-related methods to [Currency].
extension CurrencyPatterns on Currency {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Currency value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Currency() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Currency value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Currency():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Currency value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Currency() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(String code, String name, String symbol)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Currency() when $default != null:
        return $default(_that.code, _that.name, _that.symbol);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(String code, String name, String symbol) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Currency():
        return $default(_that.code, _that.name, _that.symbol);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(String code, String name, String symbol)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Currency() when $default != null:
        return $default(_that.code, _that.name, _that.symbol);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Currency implements Currency {
  const _Currency(
      {required this.code, required this.name, required this.symbol});
  factory _Currency.fromJson(Map<String, dynamic> json) =>
      _$CurrencyFromJson(json);

  @override
  final String code;
  @override
  final String name;
  @override
  final String symbol;

  /// Create a copy of Currency
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$CurrencyCopyWith<_Currency> get copyWith =>
      __$CurrencyCopyWithImpl<_Currency>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$CurrencyToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Currency &&
            (identical(other.code, code) || other.code == code) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.symbol, symbol) || other.symbol == symbol));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, code, name, symbol);

  @override
  String toString() {
    return 'Currency(code: $code, name: $name, symbol: $symbol)';
  }
}

/// @nodoc
abstract mixin class _$CurrencyCopyWith<$Res>
    implements $CurrencyCopyWith<$Res> {
  factory _$CurrencyCopyWith(_Currency value, $Res Function(_Currency) _then) =
      __$CurrencyCopyWithImpl;
  @override
  @useResult
  $Res call({String code, String name, String symbol});
}

/// @nodoc
class __$CurrencyCopyWithImpl<$Res> implements _$CurrencyCopyWith<$Res> {
  __$CurrencyCopyWithImpl(this._self, this._then);

  final _Currency _self;
  final $Res Function(_Currency) _then;

  /// Create a copy of Currency
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? code = null,
    Object? name = null,
    Object? symbol = null,
  }) {
    return _then(_Currency(
      code: null == code
          ? _self.code
          : code // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _self.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
mixin _$User {
  @JsonKey(name: 'user_id')
  String get userId;
  String get email;
  @JsonKey(name: 'full_name')
  String? get fullName;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $UserCopyWith<User> get copyWith =>
      _$UserCopyWithImpl<User>(this as User, _$identity);

  /// Serializes this User to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is User &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, userId, email, fullName);

  @override
  String toString() {
    return 'User(userId: $userId, email: $email, fullName: $fullName)';
  }
}

/// @nodoc
abstract mixin class $UserCopyWith<$Res> {
  factory $UserCopyWith(User value, $Res Function(User) _then) =
      _$UserCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'user_id') String userId,
      String email,
      @JsonKey(name: 'full_name') String? fullName});
}

/// @nodoc
class _$UserCopyWithImpl<$Res> implements $UserCopyWith<$Res> {
  _$UserCopyWithImpl(this._self, this._then);

  final User _self;
  final $Res Function(User) _then;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? userId = null,
    Object? email = null,
    Object? fullName = freezed,
  }) {
    return _then(_self.copyWith(
      userId: null == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: freezed == fullName
          ? _self.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [User].
extension UserPatterns on User {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_User value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_User value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_User value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(@JsonKey(name: 'user_id') String userId, String email,
            @JsonKey(name: 'full_name') String? fullName)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that.userId, _that.email, _that.fullName);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(@JsonKey(name: 'user_id') String userId, String email,
            @JsonKey(name: 'full_name') String? fullName)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User():
        return $default(_that.userId, _that.email, _that.fullName);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(@JsonKey(name: 'user_id') String userId, String email,
            @JsonKey(name: 'full_name') String? fullName)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _User() when $default != null:
        return $default(_that.userId, _that.email, _that.fullName);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _User implements User {
  const _User(
      {@JsonKey(name: 'user_id') required this.userId,
      required this.email,
      @JsonKey(name: 'full_name') this.fullName});
  factory _User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  @override
  @JsonKey(name: 'user_id')
  final String userId;
  @override
  final String email;
  @override
  @JsonKey(name: 'full_name')
  final String? fullName;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$UserCopyWith<_User> get copyWith =>
      __$UserCopyWithImpl<_User>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$UserToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _User &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.fullName, fullName) ||
                other.fullName == fullName));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, userId, email, fullName);

  @override
  String toString() {
    return 'User(userId: $userId, email: $email, fullName: $fullName)';
  }
}

/// @nodoc
abstract mixin class _$UserCopyWith<$Res> implements $UserCopyWith<$Res> {
  factory _$UserCopyWith(_User value, $Res Function(_User) _then) =
      __$UserCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'user_id') String userId,
      String email,
      @JsonKey(name: 'full_name') String? fullName});
}

/// @nodoc
class __$UserCopyWithImpl<$Res> implements _$UserCopyWith<$Res> {
  __$UserCopyWithImpl(this._self, this._then);

  final _User _self;
  final $Res Function(_User) _then;

  /// Create a copy of User
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? userId = null,
    Object? email = null,
    Object? fullName = freezed,
  }) {
    return _then(_User(
      userId: null == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String,
      email: null == email
          ? _self.email
          : email // ignore: cast_nullable_to_non_nullable
              as String,
      fullName: freezed == fullName
          ? _self.fullName
          : fullName // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
mixin _$Category {
  @IntConverter()
  @JsonKey(name: 'category_id')
  int get categoryId;
  String get name;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $CategoryCopyWith<Category> get copyWith =>
      _$CategoryCopyWithImpl<Category>(this as Category, _$identity);

  /// Serializes this Category to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Category &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.name, name) || other.name == name));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, categoryId, name);

  @override
  String toString() {
    return 'Category(categoryId: $categoryId, name: $name)';
  }
}

/// @nodoc
abstract mixin class $CategoryCopyWith<$Res> {
  factory $CategoryCopyWith(Category value, $Res Function(Category) _then) =
      _$CategoryCopyWithImpl;
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'category_id') int categoryId,
      String name});
}

/// @nodoc
class _$CategoryCopyWithImpl<$Res> implements $CategoryCopyWith<$Res> {
  _$CategoryCopyWithImpl(this._self, this._then);

  final Category _self;
  final $Res Function(Category) _then;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? categoryId = null,
    Object? name = null,
  }) {
    return _then(_self.copyWith(
      categoryId: null == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// Adds pattern-matching-related methods to [Category].
extension CategoryPatterns on Category {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Category value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Category() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Category value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Category():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Category value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Category() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'category_id') int categoryId,
            String name)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Category() when $default != null:
        return $default(_that.categoryId, _that.name);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'category_id') int categoryId,
            String name)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Category():
        return $default(_that.categoryId, _that.name);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @IntConverter() @JsonKey(name: 'category_id') int categoryId,
            String name)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Category() when $default != null:
        return $default(_that.categoryId, _that.name);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Category implements Category {
  const _Category(
      {@IntConverter() @JsonKey(name: 'category_id') required this.categoryId,
      required this.name});
  factory _Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);

  @override
  @IntConverter()
  @JsonKey(name: 'category_id')
  final int categoryId;
  @override
  final String name;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$CategoryCopyWith<_Category> get copyWith =>
      __$CategoryCopyWithImpl<_Category>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$CategoryToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Category &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.name, name) || other.name == name));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, categoryId, name);

  @override
  String toString() {
    return 'Category(categoryId: $categoryId, name: $name)';
  }
}

/// @nodoc
abstract mixin class _$CategoryCopyWith<$Res>
    implements $CategoryCopyWith<$Res> {
  factory _$CategoryCopyWith(_Category value, $Res Function(_Category) _then) =
      __$CategoryCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'category_id') int categoryId,
      String name});
}

/// @nodoc
class __$CategoryCopyWithImpl<$Res> implements _$CategoryCopyWith<$Res> {
  __$CategoryCopyWithImpl(this._self, this._then);

  final _Category _self;
  final $Res Function(_Category) _then;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? categoryId = null,
    Object? name = null,
  }) {
    return _then(_Category(
      categoryId: null == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
mixin _$UserSettings {
  @OptionalIntConverter()
  @JsonKey(name: 'setting_id')
  int? get settingId;
  @JsonKey(name: 'user_id')
  String? get userId;
  @JsonKey(name: 'default_currency')
  String get defaultCurrency;
  @JsonKey(name: 'exchange_provider')
  String get exchangeProvider;

  /// Create a copy of UserSettings
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $UserSettingsCopyWith<UserSettings> get copyWith =>
      _$UserSettingsCopyWithImpl<UserSettings>(
          this as UserSettings, _$identity);

  /// Serializes this UserSettings to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is UserSettings &&
            (identical(other.settingId, settingId) ||
                other.settingId == settingId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.defaultCurrency, defaultCurrency) ||
                other.defaultCurrency == defaultCurrency) &&
            (identical(other.exchangeProvider, exchangeProvider) ||
                other.exchangeProvider == exchangeProvider));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, settingId, userId, defaultCurrency, exchangeProvider);

  @override
  String toString() {
    return 'UserSettings(settingId: $settingId, userId: $userId, defaultCurrency: $defaultCurrency, exchangeProvider: $exchangeProvider)';
  }
}

/// @nodoc
abstract mixin class $UserSettingsCopyWith<$Res> {
  factory $UserSettingsCopyWith(
          UserSettings value, $Res Function(UserSettings) _then) =
      _$UserSettingsCopyWithImpl;
  @useResult
  $Res call(
      {@OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
      @JsonKey(name: 'user_id') String? userId,
      @JsonKey(name: 'default_currency') String defaultCurrency,
      @JsonKey(name: 'exchange_provider') String exchangeProvider});
}

/// @nodoc
class _$UserSettingsCopyWithImpl<$Res> implements $UserSettingsCopyWith<$Res> {
  _$UserSettingsCopyWithImpl(this._self, this._then);

  final UserSettings _self;
  final $Res Function(UserSettings) _then;

  /// Create a copy of UserSettings
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? settingId = freezed,
    Object? userId = freezed,
    Object? defaultCurrency = null,
    Object? exchangeProvider = null,
  }) {
    return _then(_self.copyWith(
      settingId: freezed == settingId
          ? _self.settingId
          : settingId // ignore: cast_nullable_to_non_nullable
              as int?,
      userId: freezed == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String?,
      defaultCurrency: null == defaultCurrency
          ? _self.defaultCurrency
          : defaultCurrency // ignore: cast_nullable_to_non_nullable
              as String,
      exchangeProvider: null == exchangeProvider
          ? _self.exchangeProvider
          : exchangeProvider // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// Adds pattern-matching-related methods to [UserSettings].
extension UserSettingsPatterns on UserSettings {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_UserSettings value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _UserSettings() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_UserSettings value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _UserSettings():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_UserSettings value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _UserSettings() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
            @JsonKey(name: 'user_id') String? userId,
            @JsonKey(name: 'default_currency') String defaultCurrency,
            @JsonKey(name: 'exchange_provider') String exchangeProvider)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _UserSettings() when $default != null:
        return $default(_that.settingId, _that.userId, _that.defaultCurrency,
            _that.exchangeProvider);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
            @JsonKey(name: 'user_id') String? userId,
            @JsonKey(name: 'default_currency') String defaultCurrency,
            @JsonKey(name: 'exchange_provider') String exchangeProvider)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _UserSettings():
        return $default(_that.settingId, _that.userId, _that.defaultCurrency,
            _that.exchangeProvider);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
            @JsonKey(name: 'user_id') String? userId,
            @JsonKey(name: 'default_currency') String defaultCurrency,
            @JsonKey(name: 'exchange_provider') String exchangeProvider)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _UserSettings() when $default != null:
        return $default(_that.settingId, _that.userId, _that.defaultCurrency,
            _that.exchangeProvider);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _UserSettings implements UserSettings {
  const _UserSettings(
      {@OptionalIntConverter() @JsonKey(name: 'setting_id') this.settingId,
      @JsonKey(name: 'user_id') this.userId,
      @JsonKey(name: 'default_currency') required this.defaultCurrency,
      @JsonKey(name: 'exchange_provider') required this.exchangeProvider});
  factory _UserSettings.fromJson(Map<String, dynamic> json) =>
      _$UserSettingsFromJson(json);

  @override
  @OptionalIntConverter()
  @JsonKey(name: 'setting_id')
  final int? settingId;
  @override
  @JsonKey(name: 'user_id')
  final String? userId;
  @override
  @JsonKey(name: 'default_currency')
  final String defaultCurrency;
  @override
  @JsonKey(name: 'exchange_provider')
  final String exchangeProvider;

  /// Create a copy of UserSettings
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$UserSettingsCopyWith<_UserSettings> get copyWith =>
      __$UserSettingsCopyWithImpl<_UserSettings>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$UserSettingsToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _UserSettings &&
            (identical(other.settingId, settingId) ||
                other.settingId == settingId) &&
            (identical(other.userId, userId) || other.userId == userId) &&
            (identical(other.defaultCurrency, defaultCurrency) ||
                other.defaultCurrency == defaultCurrency) &&
            (identical(other.exchangeProvider, exchangeProvider) ||
                other.exchangeProvider == exchangeProvider));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, settingId, userId, defaultCurrency, exchangeProvider);

  @override
  String toString() {
    return 'UserSettings(settingId: $settingId, userId: $userId, defaultCurrency: $defaultCurrency, exchangeProvider: $exchangeProvider)';
  }
}

/// @nodoc
abstract mixin class _$UserSettingsCopyWith<$Res>
    implements $UserSettingsCopyWith<$Res> {
  factory _$UserSettingsCopyWith(
          _UserSettings value, $Res Function(_UserSettings) _then) =
      __$UserSettingsCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
      @JsonKey(name: 'user_id') String? userId,
      @JsonKey(name: 'default_currency') String defaultCurrency,
      @JsonKey(name: 'exchange_provider') String exchangeProvider});
}

/// @nodoc
class __$UserSettingsCopyWithImpl<$Res>
    implements _$UserSettingsCopyWith<$Res> {
  __$UserSettingsCopyWithImpl(this._self, this._then);

  final _UserSettings _self;
  final $Res Function(_UserSettings) _then;

  /// Create a copy of UserSettings
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? settingId = freezed,
    Object? userId = freezed,
    Object? defaultCurrency = null,
    Object? exchangeProvider = null,
  }) {
    return _then(_UserSettings(
      settingId: freezed == settingId
          ? _self.settingId
          : settingId // ignore: cast_nullable_to_non_nullable
              as int?,
      userId: freezed == userId
          ? _self.userId
          : userId // ignore: cast_nullable_to_non_nullable
              as String?,
      defaultCurrency: null == defaultCurrency
          ? _self.defaultCurrency
          : defaultCurrency // ignore: cast_nullable_to_non_nullable
              as String,
      exchangeProvider: null == exchangeProvider
          ? _self.exchangeProvider
          : exchangeProvider // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
mixin _$SavingsAccount {
  @JsonKey(name: 'account_id')
  String get accountId;
  @DoubleConverter()
  double get balance;
  @OptionalDoubleConverter()
  @JsonKey(name: 'interest_rate')
  double? get interestRate;
  @OptionalDoubleConverter()
  @JsonKey(name: 'min_balance')
  double? get minBalance;
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  int? get interestAccrualDay;

  /// Create a copy of SavingsAccount
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $SavingsAccountCopyWith<SavingsAccount> get copyWith =>
      _$SavingsAccountCopyWithImpl<SavingsAccount>(
          this as SavingsAccount, _$identity);

  /// Serializes this SavingsAccount to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is SavingsAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.balance, balance) || other.balance == balance) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.minBalance, minBalance) ||
                other.minBalance == minBalance) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, accountId, balance, interestRate,
      minBalance, interestAccrualDay);

  @override
  String toString() {
    return 'SavingsAccount(accountId: $accountId, balance: $balance, interestRate: $interestRate, minBalance: $minBalance, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class $SavingsAccountCopyWith<$Res> {
  factory $SavingsAccountCopyWith(
          SavingsAccount value, $Res Function(SavingsAccount) _then) =
      _$SavingsAccountCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double balance,
      @OptionalDoubleConverter()
      @JsonKey(name: 'interest_rate')
      double? interestRate,
      @OptionalDoubleConverter()
      @JsonKey(name: 'min_balance')
      double? minBalance,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class _$SavingsAccountCopyWithImpl<$Res>
    implements $SavingsAccountCopyWith<$Res> {
  _$SavingsAccountCopyWithImpl(this._self, this._then);

  final SavingsAccount _self;
  final $Res Function(SavingsAccount) _then;

  /// Create a copy of SavingsAccount
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accountId = null,
    Object? balance = null,
    Object? interestRate = freezed,
    Object? minBalance = freezed,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_self.copyWith(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      balance: null == balance
          ? _self.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: freezed == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double?,
      minBalance: freezed == minBalance
          ? _self.minBalance
          : minBalance // ignore: cast_nullable_to_non_nullable
              as double?,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// Adds pattern-matching-related methods to [SavingsAccount].
extension SavingsAccountPatterns on SavingsAccount {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_SavingsAccount value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_SavingsAccount value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_SavingsAccount value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @OptionalDoubleConverter()
            @JsonKey(name: 'interest_rate')
            double? interestRate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'min_balance')
            double? minBalance,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount() when $default != null:
        return $default(_that.accountId, _that.balance, _that.interestRate,
            _that.minBalance, _that.interestAccrualDay);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @OptionalDoubleConverter()
            @JsonKey(name: 'interest_rate')
            double? interestRate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'min_balance')
            double? minBalance,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount():
        return $default(_that.accountId, _that.balance, _that.interestRate,
            _that.minBalance, _that.interestAccrualDay);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @OptionalDoubleConverter()
            @JsonKey(name: 'interest_rate')
            double? interestRate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'min_balance')
            double? minBalance,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SavingsAccount() when $default != null:
        return $default(_that.accountId, _that.balance, _that.interestRate,
            _that.minBalance, _that.interestAccrualDay);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _SavingsAccount implements SavingsAccount {
  const _SavingsAccount(
      {@JsonKey(name: 'account_id') required this.accountId,
      @DoubleConverter() required this.balance,
      @OptionalDoubleConverter()
      @JsonKey(name: 'interest_rate')
      this.interestRate,
      @OptionalDoubleConverter() @JsonKey(name: 'min_balance') this.minBalance,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      this.interestAccrualDay});
  factory _SavingsAccount.fromJson(Map<String, dynamic> json) =>
      _$SavingsAccountFromJson(json);

  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @DoubleConverter()
  final double balance;
  @override
  @OptionalDoubleConverter()
  @JsonKey(name: 'interest_rate')
  final double? interestRate;
  @override
  @OptionalDoubleConverter()
  @JsonKey(name: 'min_balance')
  final double? minBalance;
  @override
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  final int? interestAccrualDay;

  /// Create a copy of SavingsAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$SavingsAccountCopyWith<_SavingsAccount> get copyWith =>
      __$SavingsAccountCopyWithImpl<_SavingsAccount>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$SavingsAccountToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _SavingsAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.balance, balance) || other.balance == balance) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.minBalance, minBalance) ||
                other.minBalance == minBalance) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, accountId, balance, interestRate,
      minBalance, interestAccrualDay);

  @override
  String toString() {
    return 'SavingsAccount(accountId: $accountId, balance: $balance, interestRate: $interestRate, minBalance: $minBalance, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class _$SavingsAccountCopyWith<$Res>
    implements $SavingsAccountCopyWith<$Res> {
  factory _$SavingsAccountCopyWith(
          _SavingsAccount value, $Res Function(_SavingsAccount) _then) =
      __$SavingsAccountCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double balance,
      @OptionalDoubleConverter()
      @JsonKey(name: 'interest_rate')
      double? interestRate,
      @OptionalDoubleConverter()
      @JsonKey(name: 'min_balance')
      double? minBalance,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class __$SavingsAccountCopyWithImpl<$Res>
    implements _$SavingsAccountCopyWith<$Res> {
  __$SavingsAccountCopyWithImpl(this._self, this._then);

  final _SavingsAccount _self;
  final $Res Function(_SavingsAccount) _then;

  /// Create a copy of SavingsAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accountId = null,
    Object? balance = null,
    Object? interestRate = freezed,
    Object? minBalance = freezed,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_SavingsAccount(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      balance: null == balance
          ? _self.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: freezed == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double?,
      minBalance: freezed == minBalance
          ? _self.minBalance
          : minBalance // ignore: cast_nullable_to_non_nullable
              as double?,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
mixin _$LoanAccount {
  @JsonKey(name: 'account_id')
  String get accountId;
  @DoubleConverter()
  @JsonKey(name: 'loan_amount')
  double get loanAmount;
  @DoubleConverter()
  @JsonKey(name: 'outstanding_amount')
  double get outstandingAmount;
  @DoubleConverter()
  @JsonKey(name: 'interest_rate')
  double get interestRate;
  @IntConverter()
  @JsonKey(name: 'tenure_months')
  int get tenureMonths;
  @DoubleConverter()
  @JsonKey(name: 'emi_amount')
  double get emiAmount;
  @JsonKey(name: 'start_date')
  String get startDate;
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  int? get interestAccrualDay;

  /// Create a copy of LoanAccount
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $LoanAccountCopyWith<LoanAccount> get copyWith =>
      _$LoanAccountCopyWithImpl<LoanAccount>(this as LoanAccount, _$identity);

  /// Serializes this LoanAccount to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is LoanAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.loanAmount, loanAmount) ||
                other.loanAmount == loanAmount) &&
            (identical(other.outstandingAmount, outstandingAmount) ||
                other.outstandingAmount == outstandingAmount) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.tenureMonths, tenureMonths) ||
                other.tenureMonths == tenureMonths) &&
            (identical(other.emiAmount, emiAmount) ||
                other.emiAmount == emiAmount) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      loanAmount,
      outstandingAmount,
      interestRate,
      tenureMonths,
      emiAmount,
      startDate,
      interestAccrualDay);

  @override
  String toString() {
    return 'LoanAccount(accountId: $accountId, loanAmount: $loanAmount, outstandingAmount: $outstandingAmount, interestRate: $interestRate, tenureMonths: $tenureMonths, emiAmount: $emiAmount, startDate: $startDate, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class $LoanAccountCopyWith<$Res> {
  factory $LoanAccountCopyWith(
          LoanAccount value, $Res Function(LoanAccount) _then) =
      _$LoanAccountCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() @JsonKey(name: 'loan_amount') double loanAmount,
      @DoubleConverter()
      @JsonKey(name: 'outstanding_amount')
      double outstandingAmount,
      @DoubleConverter() @JsonKey(name: 'interest_rate') double interestRate,
      @IntConverter() @JsonKey(name: 'tenure_months') int tenureMonths,
      @DoubleConverter() @JsonKey(name: 'emi_amount') double emiAmount,
      @JsonKey(name: 'start_date') String startDate,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class _$LoanAccountCopyWithImpl<$Res> implements $LoanAccountCopyWith<$Res> {
  _$LoanAccountCopyWithImpl(this._self, this._then);

  final LoanAccount _self;
  final $Res Function(LoanAccount) _then;

  /// Create a copy of LoanAccount
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accountId = null,
    Object? loanAmount = null,
    Object? outstandingAmount = null,
    Object? interestRate = null,
    Object? tenureMonths = null,
    Object? emiAmount = null,
    Object? startDate = null,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_self.copyWith(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      loanAmount: null == loanAmount
          ? _self.loanAmount
          : loanAmount // ignore: cast_nullable_to_non_nullable
              as double,
      outstandingAmount: null == outstandingAmount
          ? _self.outstandingAmount
          : outstandingAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: null == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double,
      tenureMonths: null == tenureMonths
          ? _self.tenureMonths
          : tenureMonths // ignore: cast_nullable_to_non_nullable
              as int,
      emiAmount: null == emiAmount
          ? _self.emiAmount
          : emiAmount // ignore: cast_nullable_to_non_nullable
              as double,
      startDate: null == startDate
          ? _self.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// Adds pattern-matching-related methods to [LoanAccount].
extension LoanAccountPatterns on LoanAccount {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_LoanAccount value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _LoanAccount() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_LoanAccount value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _LoanAccount():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_LoanAccount value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _LoanAccount() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() @JsonKey(name: 'loan_amount') double loanAmount,
            @DoubleConverter()
            @JsonKey(name: 'outstanding_amount')
            double outstandingAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @IntConverter() @JsonKey(name: 'tenure_months') int tenureMonths,
            @DoubleConverter() @JsonKey(name: 'emi_amount') double emiAmount,
            @JsonKey(name: 'start_date') String startDate,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _LoanAccount() when $default != null:
        return $default(
            _that.accountId,
            _that.loanAmount,
            _that.outstandingAmount,
            _that.interestRate,
            _that.tenureMonths,
            _that.emiAmount,
            _that.startDate,
            _that.interestAccrualDay);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() @JsonKey(name: 'loan_amount') double loanAmount,
            @DoubleConverter()
            @JsonKey(name: 'outstanding_amount')
            double outstandingAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @IntConverter() @JsonKey(name: 'tenure_months') int tenureMonths,
            @DoubleConverter() @JsonKey(name: 'emi_amount') double emiAmount,
            @JsonKey(name: 'start_date') String startDate,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _LoanAccount():
        return $default(
            _that.accountId,
            _that.loanAmount,
            _that.outstandingAmount,
            _that.interestRate,
            _that.tenureMonths,
            _that.emiAmount,
            _that.startDate,
            _that.interestAccrualDay);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() @JsonKey(name: 'loan_amount') double loanAmount,
            @DoubleConverter()
            @JsonKey(name: 'outstanding_amount')
            double outstandingAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @IntConverter() @JsonKey(name: 'tenure_months') int tenureMonths,
            @DoubleConverter() @JsonKey(name: 'emi_amount') double emiAmount,
            @JsonKey(name: 'start_date') String startDate,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _LoanAccount() when $default != null:
        return $default(
            _that.accountId,
            _that.loanAmount,
            _that.outstandingAmount,
            _that.interestRate,
            _that.tenureMonths,
            _that.emiAmount,
            _that.startDate,
            _that.interestAccrualDay);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _LoanAccount implements LoanAccount {
  const _LoanAccount(
      {@JsonKey(name: 'account_id') required this.accountId,
      @DoubleConverter() @JsonKey(name: 'loan_amount') required this.loanAmount,
      @DoubleConverter()
      @JsonKey(name: 'outstanding_amount')
      required this.outstandingAmount,
      @DoubleConverter()
      @JsonKey(name: 'interest_rate')
      required this.interestRate,
      @IntConverter()
      @JsonKey(name: 'tenure_months')
      required this.tenureMonths,
      @DoubleConverter() @JsonKey(name: 'emi_amount') required this.emiAmount,
      @JsonKey(name: 'start_date') required this.startDate,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      this.interestAccrualDay});
  factory _LoanAccount.fromJson(Map<String, dynamic> json) =>
      _$LoanAccountFromJson(json);

  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @DoubleConverter()
  @JsonKey(name: 'loan_amount')
  final double loanAmount;
  @override
  @DoubleConverter()
  @JsonKey(name: 'outstanding_amount')
  final double outstandingAmount;
  @override
  @DoubleConverter()
  @JsonKey(name: 'interest_rate')
  final double interestRate;
  @override
  @IntConverter()
  @JsonKey(name: 'tenure_months')
  final int tenureMonths;
  @override
  @DoubleConverter()
  @JsonKey(name: 'emi_amount')
  final double emiAmount;
  @override
  @JsonKey(name: 'start_date')
  final String startDate;
  @override
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  final int? interestAccrualDay;

  /// Create a copy of LoanAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$LoanAccountCopyWith<_LoanAccount> get copyWith =>
      __$LoanAccountCopyWithImpl<_LoanAccount>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$LoanAccountToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _LoanAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.loanAmount, loanAmount) ||
                other.loanAmount == loanAmount) &&
            (identical(other.outstandingAmount, outstandingAmount) ||
                other.outstandingAmount == outstandingAmount) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.tenureMonths, tenureMonths) ||
                other.tenureMonths == tenureMonths) &&
            (identical(other.emiAmount, emiAmount) ||
                other.emiAmount == emiAmount) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      loanAmount,
      outstandingAmount,
      interestRate,
      tenureMonths,
      emiAmount,
      startDate,
      interestAccrualDay);

  @override
  String toString() {
    return 'LoanAccount(accountId: $accountId, loanAmount: $loanAmount, outstandingAmount: $outstandingAmount, interestRate: $interestRate, tenureMonths: $tenureMonths, emiAmount: $emiAmount, startDate: $startDate, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class _$LoanAccountCopyWith<$Res>
    implements $LoanAccountCopyWith<$Res> {
  factory _$LoanAccountCopyWith(
          _LoanAccount value, $Res Function(_LoanAccount) _then) =
      __$LoanAccountCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() @JsonKey(name: 'loan_amount') double loanAmount,
      @DoubleConverter()
      @JsonKey(name: 'outstanding_amount')
      double outstandingAmount,
      @DoubleConverter() @JsonKey(name: 'interest_rate') double interestRate,
      @IntConverter() @JsonKey(name: 'tenure_months') int tenureMonths,
      @DoubleConverter() @JsonKey(name: 'emi_amount') double emiAmount,
      @JsonKey(name: 'start_date') String startDate,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class __$LoanAccountCopyWithImpl<$Res> implements _$LoanAccountCopyWith<$Res> {
  __$LoanAccountCopyWithImpl(this._self, this._then);

  final _LoanAccount _self;
  final $Res Function(_LoanAccount) _then;

  /// Create a copy of LoanAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accountId = null,
    Object? loanAmount = null,
    Object? outstandingAmount = null,
    Object? interestRate = null,
    Object? tenureMonths = null,
    Object? emiAmount = null,
    Object? startDate = null,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_LoanAccount(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      loanAmount: null == loanAmount
          ? _self.loanAmount
          : loanAmount // ignore: cast_nullable_to_non_nullable
              as double,
      outstandingAmount: null == outstandingAmount
          ? _self.outstandingAmount
          : outstandingAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: null == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double,
      tenureMonths: null == tenureMonths
          ? _self.tenureMonths
          : tenureMonths // ignore: cast_nullable_to_non_nullable
              as int,
      emiAmount: null == emiAmount
          ? _self.emiAmount
          : emiAmount // ignore: cast_nullable_to_non_nullable
              as double,
      startDate: null == startDate
          ? _self.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
mixin _$FixedDepositAccount {
  @JsonKey(name: 'account_id')
  String get accountId;
  @DoubleConverter()
  double get balance;
  @DoubleConverter()
  @JsonKey(name: 'principal_amount')
  double get principalAmount;
  @DoubleConverter()
  @JsonKey(name: 'interest_rate')
  double get interestRate;
  @JsonKey(name: 'start_date')
  String get startDate;
  @JsonKey(name: 'maturity_date')
  String get maturityDate;
  @DoubleConverter()
  @JsonKey(name: 'maturity_amount')
  double get maturityAmount;
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  int? get interestAccrualDay;

  /// Create a copy of FixedDepositAccount
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $FixedDepositAccountCopyWith<FixedDepositAccount> get copyWith =>
      _$FixedDepositAccountCopyWithImpl<FixedDepositAccount>(
          this as FixedDepositAccount, _$identity);

  /// Serializes this FixedDepositAccount to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is FixedDepositAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.balance, balance) || other.balance == balance) &&
            (identical(other.principalAmount, principalAmount) ||
                other.principalAmount == principalAmount) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.maturityDate, maturityDate) ||
                other.maturityDate == maturityDate) &&
            (identical(other.maturityAmount, maturityAmount) ||
                other.maturityAmount == maturityAmount) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      balance,
      principalAmount,
      interestRate,
      startDate,
      maturityDate,
      maturityAmount,
      interestAccrualDay);

  @override
  String toString() {
    return 'FixedDepositAccount(accountId: $accountId, balance: $balance, principalAmount: $principalAmount, interestRate: $interestRate, startDate: $startDate, maturityDate: $maturityDate, maturityAmount: $maturityAmount, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class $FixedDepositAccountCopyWith<$Res> {
  factory $FixedDepositAccountCopyWith(
          FixedDepositAccount value, $Res Function(FixedDepositAccount) _then) =
      _$FixedDepositAccountCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double balance,
      @DoubleConverter()
      @JsonKey(name: 'principal_amount')
      double principalAmount,
      @DoubleConverter() @JsonKey(name: 'interest_rate') double interestRate,
      @JsonKey(name: 'start_date') String startDate,
      @JsonKey(name: 'maturity_date') String maturityDate,
      @DoubleConverter()
      @JsonKey(name: 'maturity_amount')
      double maturityAmount,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class _$FixedDepositAccountCopyWithImpl<$Res>
    implements $FixedDepositAccountCopyWith<$Res> {
  _$FixedDepositAccountCopyWithImpl(this._self, this._then);

  final FixedDepositAccount _self;
  final $Res Function(FixedDepositAccount) _then;

  /// Create a copy of FixedDepositAccount
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accountId = null,
    Object? balance = null,
    Object? principalAmount = null,
    Object? interestRate = null,
    Object? startDate = null,
    Object? maturityDate = null,
    Object? maturityAmount = null,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_self.copyWith(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      balance: null == balance
          ? _self.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      principalAmount: null == principalAmount
          ? _self.principalAmount
          : principalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: null == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double,
      startDate: null == startDate
          ? _self.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String,
      maturityDate: null == maturityDate
          ? _self.maturityDate
          : maturityDate // ignore: cast_nullable_to_non_nullable
              as String,
      maturityAmount: null == maturityAmount
          ? _self.maturityAmount
          : maturityAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// Adds pattern-matching-related methods to [FixedDepositAccount].
extension FixedDepositAccountPatterns on FixedDepositAccount {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_FixedDepositAccount value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_FixedDepositAccount value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_FixedDepositAccount value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @DoubleConverter()
            @JsonKey(name: 'principal_amount')
            double principalAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @JsonKey(name: 'start_date') String startDate,
            @JsonKey(name: 'maturity_date') String maturityDate,
            @DoubleConverter()
            @JsonKey(name: 'maturity_amount')
            double maturityAmount,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount() when $default != null:
        return $default(
            _that.accountId,
            _that.balance,
            _that.principalAmount,
            _that.interestRate,
            _that.startDate,
            _that.maturityDate,
            _that.maturityAmount,
            _that.interestAccrualDay);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @DoubleConverter()
            @JsonKey(name: 'principal_amount')
            double principalAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @JsonKey(name: 'start_date') String startDate,
            @JsonKey(name: 'maturity_date') String maturityDate,
            @DoubleConverter()
            @JsonKey(name: 'maturity_amount')
            double maturityAmount,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount():
        return $default(
            _that.accountId,
            _that.balance,
            _that.principalAmount,
            _that.interestRate,
            _that.startDate,
            _that.maturityDate,
            _that.maturityAmount,
            _that.interestAccrualDay);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double balance,
            @DoubleConverter()
            @JsonKey(name: 'principal_amount')
            double principalAmount,
            @DoubleConverter()
            @JsonKey(name: 'interest_rate')
            double interestRate,
            @JsonKey(name: 'start_date') String startDate,
            @JsonKey(name: 'maturity_date') String maturityDate,
            @DoubleConverter()
            @JsonKey(name: 'maturity_amount')
            double maturityAmount,
            @OptionalIntConverter()
            @JsonKey(name: 'interest_accrual_day')
            int? interestAccrualDay)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _FixedDepositAccount() when $default != null:
        return $default(
            _that.accountId,
            _that.balance,
            _that.principalAmount,
            _that.interestRate,
            _that.startDate,
            _that.maturityDate,
            _that.maturityAmount,
            _that.interestAccrualDay);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _FixedDepositAccount implements FixedDepositAccount {
  const _FixedDepositAccount(
      {@JsonKey(name: 'account_id') required this.accountId,
      @DoubleConverter() required this.balance,
      @DoubleConverter()
      @JsonKey(name: 'principal_amount')
      required this.principalAmount,
      @DoubleConverter()
      @JsonKey(name: 'interest_rate')
      required this.interestRate,
      @JsonKey(name: 'start_date') required this.startDate,
      @JsonKey(name: 'maturity_date') required this.maturityDate,
      @DoubleConverter()
      @JsonKey(name: 'maturity_amount')
      required this.maturityAmount,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      this.interestAccrualDay});
  factory _FixedDepositAccount.fromJson(Map<String, dynamic> json) =>
      _$FixedDepositAccountFromJson(json);

  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @DoubleConverter()
  final double balance;
  @override
  @DoubleConverter()
  @JsonKey(name: 'principal_amount')
  final double principalAmount;
  @override
  @DoubleConverter()
  @JsonKey(name: 'interest_rate')
  final double interestRate;
  @override
  @JsonKey(name: 'start_date')
  final String startDate;
  @override
  @JsonKey(name: 'maturity_date')
  final String maturityDate;
  @override
  @DoubleConverter()
  @JsonKey(name: 'maturity_amount')
  final double maturityAmount;
  @override
  @OptionalIntConverter()
  @JsonKey(name: 'interest_accrual_day')
  final int? interestAccrualDay;

  /// Create a copy of FixedDepositAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$FixedDepositAccountCopyWith<_FixedDepositAccount> get copyWith =>
      __$FixedDepositAccountCopyWithImpl<_FixedDepositAccount>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$FixedDepositAccountToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _FixedDepositAccount &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.balance, balance) || other.balance == balance) &&
            (identical(other.principalAmount, principalAmount) ||
                other.principalAmount == principalAmount) &&
            (identical(other.interestRate, interestRate) ||
                other.interestRate == interestRate) &&
            (identical(other.startDate, startDate) ||
                other.startDate == startDate) &&
            (identical(other.maturityDate, maturityDate) ||
                other.maturityDate == maturityDate) &&
            (identical(other.maturityAmount, maturityAmount) ||
                other.maturityAmount == maturityAmount) &&
            (identical(other.interestAccrualDay, interestAccrualDay) ||
                other.interestAccrualDay == interestAccrualDay));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      balance,
      principalAmount,
      interestRate,
      startDate,
      maturityDate,
      maturityAmount,
      interestAccrualDay);

  @override
  String toString() {
    return 'FixedDepositAccount(accountId: $accountId, balance: $balance, principalAmount: $principalAmount, interestRate: $interestRate, startDate: $startDate, maturityDate: $maturityDate, maturityAmount: $maturityAmount, interestAccrualDay: $interestAccrualDay)';
  }
}

/// @nodoc
abstract mixin class _$FixedDepositAccountCopyWith<$Res>
    implements $FixedDepositAccountCopyWith<$Res> {
  factory _$FixedDepositAccountCopyWith(_FixedDepositAccount value,
          $Res Function(_FixedDepositAccount) _then) =
      __$FixedDepositAccountCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double balance,
      @DoubleConverter()
      @JsonKey(name: 'principal_amount')
      double principalAmount,
      @DoubleConverter() @JsonKey(name: 'interest_rate') double interestRate,
      @JsonKey(name: 'start_date') String startDate,
      @JsonKey(name: 'maturity_date') String maturityDate,
      @DoubleConverter()
      @JsonKey(name: 'maturity_amount')
      double maturityAmount,
      @OptionalIntConverter()
      @JsonKey(name: 'interest_accrual_day')
      int? interestAccrualDay});
}

/// @nodoc
class __$FixedDepositAccountCopyWithImpl<$Res>
    implements _$FixedDepositAccountCopyWith<$Res> {
  __$FixedDepositAccountCopyWithImpl(this._self, this._then);

  final _FixedDepositAccount _self;
  final $Res Function(_FixedDepositAccount) _then;

  /// Create a copy of FixedDepositAccount
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accountId = null,
    Object? balance = null,
    Object? principalAmount = null,
    Object? interestRate = null,
    Object? startDate = null,
    Object? maturityDate = null,
    Object? maturityAmount = null,
    Object? interestAccrualDay = freezed,
  }) {
    return _then(_FixedDepositAccount(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      balance: null == balance
          ? _self.balance
          : balance // ignore: cast_nullable_to_non_nullable
              as double,
      principalAmount: null == principalAmount
          ? _self.principalAmount
          : principalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestRate: null == interestRate
          ? _self.interestRate
          : interestRate // ignore: cast_nullable_to_non_nullable
              as double,
      startDate: null == startDate
          ? _self.startDate
          : startDate // ignore: cast_nullable_to_non_nullable
              as String,
      maturityDate: null == maturityDate
          ? _self.maturityDate
          : maturityDate // ignore: cast_nullable_to_non_nullable
              as String,
      maturityAmount: null == maturityAmount
          ? _self.maturityAmount
          : maturityAmount // ignore: cast_nullable_to_non_nullable
              as double,
      interestAccrualDay: freezed == interestAccrualDay
          ? _self.interestAccrualDay
          : interestAccrualDay // ignore: cast_nullable_to_non_nullable
              as int?,
    ));
  }
}

/// @nodoc
mixin _$InvestmentHolding {
  @IntConverter()
  @JsonKey(name: 'holding_id')
  int get holdingId;
  @JsonKey(name: 'account_id')
  String get accountId;
  String get symbol;
  String get name;
  @DoubleConverter()
  double get quantity;
  @DoubleConverter()
  @JsonKey(name: 'average_price')
  double get averagePrice;
  @OptionalDoubleConverter()
  @JsonKey(name: 'current_price')
  double? get currentPrice;
  String get currency;
  @JsonKey(name: 'stock_exchange')
  String? get stockExchange;
  @JsonKey(name: 'last_price_update')
  String? get lastPriceUpdate;

  /// Create a copy of InvestmentHolding
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $InvestmentHoldingCopyWith<InvestmentHolding> get copyWith =>
      _$InvestmentHoldingCopyWithImpl<InvestmentHolding>(
          this as InvestmentHolding, _$identity);

  /// Serializes this InvestmentHolding to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is InvestmentHolding &&
            (identical(other.holdingId, holdingId) ||
                other.holdingId == holdingId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.averagePrice, averagePrice) ||
                other.averagePrice == averagePrice) &&
            (identical(other.currentPrice, currentPrice) ||
                other.currentPrice == currentPrice) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.stockExchange, stockExchange) ||
                other.stockExchange == stockExchange) &&
            (identical(other.lastPriceUpdate, lastPriceUpdate) ||
                other.lastPriceUpdate == lastPriceUpdate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      holdingId,
      accountId,
      symbol,
      name,
      quantity,
      averagePrice,
      currentPrice,
      currency,
      stockExchange,
      lastPriceUpdate);

  @override
  String toString() {
    return 'InvestmentHolding(holdingId: $holdingId, accountId: $accountId, symbol: $symbol, name: $name, quantity: $quantity, averagePrice: $averagePrice, currentPrice: $currentPrice, currency: $currency, stockExchange: $stockExchange, lastPriceUpdate: $lastPriceUpdate)';
  }
}

/// @nodoc
abstract mixin class $InvestmentHoldingCopyWith<$Res> {
  factory $InvestmentHoldingCopyWith(
          InvestmentHolding value, $Res Function(InvestmentHolding) _then) =
      _$InvestmentHoldingCopyWithImpl;
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'holding_id') int holdingId,
      @JsonKey(name: 'account_id') String accountId,
      String symbol,
      String name,
      @DoubleConverter() double quantity,
      @DoubleConverter() @JsonKey(name: 'average_price') double averagePrice,
      @OptionalDoubleConverter()
      @JsonKey(name: 'current_price')
      double? currentPrice,
      String currency,
      @JsonKey(name: 'stock_exchange') String? stockExchange,
      @JsonKey(name: 'last_price_update') String? lastPriceUpdate});
}

/// @nodoc
class _$InvestmentHoldingCopyWithImpl<$Res>
    implements $InvestmentHoldingCopyWith<$Res> {
  _$InvestmentHoldingCopyWithImpl(this._self, this._then);

  final InvestmentHolding _self;
  final $Res Function(InvestmentHolding) _then;

  /// Create a copy of InvestmentHolding
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? holdingId = null,
    Object? accountId = null,
    Object? symbol = null,
    Object? name = null,
    Object? quantity = null,
    Object? averagePrice = null,
    Object? currentPrice = freezed,
    Object? currency = null,
    Object? stockExchange = freezed,
    Object? lastPriceUpdate = freezed,
  }) {
    return _then(_self.copyWith(
      holdingId: null == holdingId
          ? _self.holdingId
          : holdingId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _self.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as double,
      averagePrice: null == averagePrice
          ? _self.averagePrice
          : averagePrice // ignore: cast_nullable_to_non_nullable
              as double,
      currentPrice: freezed == currentPrice
          ? _self.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
              as double?,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      stockExchange: freezed == stockExchange
          ? _self.stockExchange
          : stockExchange // ignore: cast_nullable_to_non_nullable
              as String?,
      lastPriceUpdate: freezed == lastPriceUpdate
          ? _self.lastPriceUpdate
          : lastPriceUpdate // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [InvestmentHolding].
extension InvestmentHoldingPatterns on InvestmentHolding {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_InvestmentHolding value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_InvestmentHolding value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_InvestmentHolding value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'holding_id') int holdingId,
            @JsonKey(name: 'account_id') String accountId,
            String symbol,
            String name,
            @DoubleConverter() double quantity,
            @DoubleConverter()
            @JsonKey(name: 'average_price')
            double averagePrice,
            @OptionalDoubleConverter()
            @JsonKey(name: 'current_price')
            double? currentPrice,
            String currency,
            @JsonKey(name: 'stock_exchange') String? stockExchange,
            @JsonKey(name: 'last_price_update') String? lastPriceUpdate)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding() when $default != null:
        return $default(
            _that.holdingId,
            _that.accountId,
            _that.symbol,
            _that.name,
            _that.quantity,
            _that.averagePrice,
            _that.currentPrice,
            _that.currency,
            _that.stockExchange,
            _that.lastPriceUpdate);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'holding_id') int holdingId,
            @JsonKey(name: 'account_id') String accountId,
            String symbol,
            String name,
            @DoubleConverter() double quantity,
            @DoubleConverter()
            @JsonKey(name: 'average_price')
            double averagePrice,
            @OptionalDoubleConverter()
            @JsonKey(name: 'current_price')
            double? currentPrice,
            String currency,
            @JsonKey(name: 'stock_exchange') String? stockExchange,
            @JsonKey(name: 'last_price_update') String? lastPriceUpdate)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding():
        return $default(
            _that.holdingId,
            _that.accountId,
            _that.symbol,
            _that.name,
            _that.quantity,
            _that.averagePrice,
            _that.currentPrice,
            _that.currency,
            _that.stockExchange,
            _that.lastPriceUpdate);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @IntConverter() @JsonKey(name: 'holding_id') int holdingId,
            @JsonKey(name: 'account_id') String accountId,
            String symbol,
            String name,
            @DoubleConverter() double quantity,
            @DoubleConverter()
            @JsonKey(name: 'average_price')
            double averagePrice,
            @OptionalDoubleConverter()
            @JsonKey(name: 'current_price')
            double? currentPrice,
            String currency,
            @JsonKey(name: 'stock_exchange') String? stockExchange,
            @JsonKey(name: 'last_price_update') String? lastPriceUpdate)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _InvestmentHolding() when $default != null:
        return $default(
            _that.holdingId,
            _that.accountId,
            _that.symbol,
            _that.name,
            _that.quantity,
            _that.averagePrice,
            _that.currentPrice,
            _that.currency,
            _that.stockExchange,
            _that.lastPriceUpdate);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _InvestmentHolding implements InvestmentHolding {
  const _InvestmentHolding(
      {@IntConverter() @JsonKey(name: 'holding_id') required this.holdingId,
      @JsonKey(name: 'account_id') required this.accountId,
      required this.symbol,
      required this.name,
      @DoubleConverter() required this.quantity,
      @DoubleConverter()
      @JsonKey(name: 'average_price')
      required this.averagePrice,
      @OptionalDoubleConverter()
      @JsonKey(name: 'current_price')
      this.currentPrice,
      required this.currency,
      @JsonKey(name: 'stock_exchange') this.stockExchange,
      @JsonKey(name: 'last_price_update') this.lastPriceUpdate});
  factory _InvestmentHolding.fromJson(Map<String, dynamic> json) =>
      _$InvestmentHoldingFromJson(json);

  @override
  @IntConverter()
  @JsonKey(name: 'holding_id')
  final int holdingId;
  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  final String symbol;
  @override
  final String name;
  @override
  @DoubleConverter()
  final double quantity;
  @override
  @DoubleConverter()
  @JsonKey(name: 'average_price')
  final double averagePrice;
  @override
  @OptionalDoubleConverter()
  @JsonKey(name: 'current_price')
  final double? currentPrice;
  @override
  final String currency;
  @override
  @JsonKey(name: 'stock_exchange')
  final String? stockExchange;
  @override
  @JsonKey(name: 'last_price_update')
  final String? lastPriceUpdate;

  /// Create a copy of InvestmentHolding
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$InvestmentHoldingCopyWith<_InvestmentHolding> get copyWith =>
      __$InvestmentHoldingCopyWithImpl<_InvestmentHolding>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$InvestmentHoldingToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _InvestmentHolding &&
            (identical(other.holdingId, holdingId) ||
                other.holdingId == holdingId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.symbol, symbol) || other.symbol == symbol) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.quantity, quantity) ||
                other.quantity == quantity) &&
            (identical(other.averagePrice, averagePrice) ||
                other.averagePrice == averagePrice) &&
            (identical(other.currentPrice, currentPrice) ||
                other.currentPrice == currentPrice) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.stockExchange, stockExchange) ||
                other.stockExchange == stockExchange) &&
            (identical(other.lastPriceUpdate, lastPriceUpdate) ||
                other.lastPriceUpdate == lastPriceUpdate));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      holdingId,
      accountId,
      symbol,
      name,
      quantity,
      averagePrice,
      currentPrice,
      currency,
      stockExchange,
      lastPriceUpdate);

  @override
  String toString() {
    return 'InvestmentHolding(holdingId: $holdingId, accountId: $accountId, symbol: $symbol, name: $name, quantity: $quantity, averagePrice: $averagePrice, currentPrice: $currentPrice, currency: $currency, stockExchange: $stockExchange, lastPriceUpdate: $lastPriceUpdate)';
  }
}

/// @nodoc
abstract mixin class _$InvestmentHoldingCopyWith<$Res>
    implements $InvestmentHoldingCopyWith<$Res> {
  factory _$InvestmentHoldingCopyWith(
          _InvestmentHolding value, $Res Function(_InvestmentHolding) _then) =
      __$InvestmentHoldingCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'holding_id') int holdingId,
      @JsonKey(name: 'account_id') String accountId,
      String symbol,
      String name,
      @DoubleConverter() double quantity,
      @DoubleConverter() @JsonKey(name: 'average_price') double averagePrice,
      @OptionalDoubleConverter()
      @JsonKey(name: 'current_price')
      double? currentPrice,
      String currency,
      @JsonKey(name: 'stock_exchange') String? stockExchange,
      @JsonKey(name: 'last_price_update') String? lastPriceUpdate});
}

/// @nodoc
class __$InvestmentHoldingCopyWithImpl<$Res>
    implements _$InvestmentHoldingCopyWith<$Res> {
  __$InvestmentHoldingCopyWithImpl(this._self, this._then);

  final _InvestmentHolding _self;
  final $Res Function(_InvestmentHolding) _then;

  /// Create a copy of InvestmentHolding
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? holdingId = null,
    Object? accountId = null,
    Object? symbol = null,
    Object? name = null,
    Object? quantity = null,
    Object? averagePrice = null,
    Object? currentPrice = freezed,
    Object? currency = null,
    Object? stockExchange = freezed,
    Object? lastPriceUpdate = freezed,
  }) {
    return _then(_InvestmentHolding(
      holdingId: null == holdingId
          ? _self.holdingId
          : holdingId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      symbol: null == symbol
          ? _self.symbol
          : symbol // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      quantity: null == quantity
          ? _self.quantity
          : quantity // ignore: cast_nullable_to_non_nullable
              as double,
      averagePrice: null == averagePrice
          ? _self.averagePrice
          : averagePrice // ignore: cast_nullable_to_non_nullable
              as double,
      currentPrice: freezed == currentPrice
          ? _self.currentPrice
          : currentPrice // ignore: cast_nullable_to_non_nullable
              as double?,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      stockExchange: freezed == stockExchange
          ? _self.stockExchange
          : stockExchange // ignore: cast_nullable_to_non_nullable
              as String?,
      lastPriceUpdate: freezed == lastPriceUpdate
          ? _self.lastPriceUpdate
          : lastPriceUpdate // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
mixin _$Account {
  @JsonKey(name: 'account_id')
  String get accountId;
  @JsonKey(name: 'account_name')
  String? get accountName;
  @JsonKey(name: 'account_type')
  AccountType get accountType;
  String get currency;
  String get status;
  @JsonKey(name: 'is_interest_enabled')
  bool get isInterestEnabled;
  @JsonKey(name: 'created_at')
  String get createdAt;
  @JsonKey(name: 'savings_account')
  SavingsAccount? get savingsAccount;
  @JsonKey(name: 'loan_account')
  LoanAccount? get loanAccount;
  @JsonKey(name: 'fixed_deposit_account')
  FixedDepositAccount? get fixedDepositAccount;
  @JsonKey(name: 'investment_holdings')
  List<InvestmentHolding> get investmentHoldings;

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AccountCopyWith<Account> get copyWith =>
      _$AccountCopyWithImpl<Account>(this as Account, _$identity);

  /// Serializes this Account to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Account &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.accountName, accountName) ||
                other.accountName == accountName) &&
            (identical(other.accountType, accountType) ||
                other.accountType == accountType) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.isInterestEnabled, isInterestEnabled) ||
                other.isInterestEnabled == isInterestEnabled) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.savingsAccount, savingsAccount) ||
                other.savingsAccount == savingsAccount) &&
            (identical(other.loanAccount, loanAccount) ||
                other.loanAccount == loanAccount) &&
            (identical(other.fixedDepositAccount, fixedDepositAccount) ||
                other.fixedDepositAccount == fixedDepositAccount) &&
            const DeepCollectionEquality()
                .equals(other.investmentHoldings, investmentHoldings));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      accountName,
      accountType,
      currency,
      status,
      isInterestEnabled,
      createdAt,
      savingsAccount,
      loanAccount,
      fixedDepositAccount,
      const DeepCollectionEquality().hash(investmentHoldings));

  @override
  String toString() {
    return 'Account(accountId: $accountId, accountName: $accountName, accountType: $accountType, currency: $currency, status: $status, isInterestEnabled: $isInterestEnabled, createdAt: $createdAt, savingsAccount: $savingsAccount, loanAccount: $loanAccount, fixedDepositAccount: $fixedDepositAccount, investmentHoldings: $investmentHoldings)';
  }
}

/// @nodoc
abstract mixin class $AccountCopyWith<$Res> {
  factory $AccountCopyWith(Account value, $Res Function(Account) _then) =
      _$AccountCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @JsonKey(name: 'account_name') String? accountName,
      @JsonKey(name: 'account_type') AccountType accountType,
      String currency,
      String status,
      @JsonKey(name: 'is_interest_enabled') bool isInterestEnabled,
      @JsonKey(name: 'created_at') String createdAt,
      @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
      @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
      @JsonKey(name: 'fixed_deposit_account')
      FixedDepositAccount? fixedDepositAccount,
      @JsonKey(name: 'investment_holdings')
      List<InvestmentHolding> investmentHoldings});

  $SavingsAccountCopyWith<$Res>? get savingsAccount;
  $LoanAccountCopyWith<$Res>? get loanAccount;
  $FixedDepositAccountCopyWith<$Res>? get fixedDepositAccount;
}

/// @nodoc
class _$AccountCopyWithImpl<$Res> implements $AccountCopyWith<$Res> {
  _$AccountCopyWithImpl(this._self, this._then);

  final Account _self;
  final $Res Function(Account) _then;

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accountId = null,
    Object? accountName = freezed,
    Object? accountType = null,
    Object? currency = null,
    Object? status = null,
    Object? isInterestEnabled = null,
    Object? createdAt = null,
    Object? savingsAccount = freezed,
    Object? loanAccount = freezed,
    Object? fixedDepositAccount = freezed,
    Object? investmentHoldings = null,
  }) {
    return _then(_self.copyWith(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: freezed == accountName
          ? _self.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String?,
      accountType: null == accountType
          ? _self.accountType
          : accountType // ignore: cast_nullable_to_non_nullable
              as AccountType,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      isInterestEnabled: null == isInterestEnabled
          ? _self.isInterestEnabled
          : isInterestEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      savingsAccount: freezed == savingsAccount
          ? _self.savingsAccount
          : savingsAccount // ignore: cast_nullable_to_non_nullable
              as SavingsAccount?,
      loanAccount: freezed == loanAccount
          ? _self.loanAccount
          : loanAccount // ignore: cast_nullable_to_non_nullable
              as LoanAccount?,
      fixedDepositAccount: freezed == fixedDepositAccount
          ? _self.fixedDepositAccount
          : fixedDepositAccount // ignore: cast_nullable_to_non_nullable
              as FixedDepositAccount?,
      investmentHoldings: null == investmentHoldings
          ? _self.investmentHoldings
          : investmentHoldings // ignore: cast_nullable_to_non_nullable
              as List<InvestmentHolding>,
    ));
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SavingsAccountCopyWith<$Res>? get savingsAccount {
    if (_self.savingsAccount == null) {
      return null;
    }

    return $SavingsAccountCopyWith<$Res>(_self.savingsAccount!, (value) {
      return _then(_self.copyWith(savingsAccount: value));
    });
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $LoanAccountCopyWith<$Res>? get loanAccount {
    if (_self.loanAccount == null) {
      return null;
    }

    return $LoanAccountCopyWith<$Res>(_self.loanAccount!, (value) {
      return _then(_self.copyWith(loanAccount: value));
    });
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $FixedDepositAccountCopyWith<$Res>? get fixedDepositAccount {
    if (_self.fixedDepositAccount == null) {
      return null;
    }

    return $FixedDepositAccountCopyWith<$Res>(_self.fixedDepositAccount!,
        (value) {
      return _then(_self.copyWith(fixedDepositAccount: value));
    });
  }
}

/// Adds pattern-matching-related methods to [Account].
extension AccountPatterns on Account {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Account value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Account() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Account value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Account():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Account value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Account() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            String status,
            @JsonKey(name: 'is_interest_enabled') bool isInterestEnabled,
            @JsonKey(name: 'created_at') String createdAt,
            @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
            @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
            @JsonKey(name: 'fixed_deposit_account')
            FixedDepositAccount? fixedDepositAccount,
            @JsonKey(name: 'investment_holdings')
            List<InvestmentHolding> investmentHoldings)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Account() when $default != null:
        return $default(
            _that.accountId,
            _that.accountName,
            _that.accountType,
            _that.currency,
            _that.status,
            _that.isInterestEnabled,
            _that.createdAt,
            _that.savingsAccount,
            _that.loanAccount,
            _that.fixedDepositAccount,
            _that.investmentHoldings);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            String status,
            @JsonKey(name: 'is_interest_enabled') bool isInterestEnabled,
            @JsonKey(name: 'created_at') String createdAt,
            @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
            @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
            @JsonKey(name: 'fixed_deposit_account')
            FixedDepositAccount? fixedDepositAccount,
            @JsonKey(name: 'investment_holdings')
            List<InvestmentHolding> investmentHoldings)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Account():
        return $default(
            _that.accountId,
            _that.accountName,
            _that.accountType,
            _that.currency,
            _that.status,
            _that.isInterestEnabled,
            _that.createdAt,
            _that.savingsAccount,
            _that.loanAccount,
            _that.fixedDepositAccount,
            _that.investmentHoldings);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            String status,
            @JsonKey(name: 'is_interest_enabled') bool isInterestEnabled,
            @JsonKey(name: 'created_at') String createdAt,
            @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
            @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
            @JsonKey(name: 'fixed_deposit_account')
            FixedDepositAccount? fixedDepositAccount,
            @JsonKey(name: 'investment_holdings')
            List<InvestmentHolding> investmentHoldings)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Account() when $default != null:
        return $default(
            _that.accountId,
            _that.accountName,
            _that.accountType,
            _that.currency,
            _that.status,
            _that.isInterestEnabled,
            _that.createdAt,
            _that.savingsAccount,
            _that.loanAccount,
            _that.fixedDepositAccount,
            _that.investmentHoldings);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Account implements Account {
  const _Account(
      {@JsonKey(name: 'account_id') required this.accountId,
      @JsonKey(name: 'account_name') this.accountName,
      @JsonKey(name: 'account_type') required this.accountType,
      required this.currency,
      required this.status,
      @JsonKey(name: 'is_interest_enabled') required this.isInterestEnabled,
      @JsonKey(name: 'created_at') required this.createdAt,
      @JsonKey(name: 'savings_account') this.savingsAccount,
      @JsonKey(name: 'loan_account') this.loanAccount,
      @JsonKey(name: 'fixed_deposit_account') this.fixedDepositAccount,
      @JsonKey(name: 'investment_holdings')
      final List<InvestmentHolding> investmentHoldings = const []})
      : _investmentHoldings = investmentHoldings;
  factory _Account.fromJson(Map<String, dynamic> json) =>
      _$AccountFromJson(json);

  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @JsonKey(name: 'account_name')
  final String? accountName;
  @override
  @JsonKey(name: 'account_type')
  final AccountType accountType;
  @override
  final String currency;
  @override
  final String status;
  @override
  @JsonKey(name: 'is_interest_enabled')
  final bool isInterestEnabled;
  @override
  @JsonKey(name: 'created_at')
  final String createdAt;
  @override
  @JsonKey(name: 'savings_account')
  final SavingsAccount? savingsAccount;
  @override
  @JsonKey(name: 'loan_account')
  final LoanAccount? loanAccount;
  @override
  @JsonKey(name: 'fixed_deposit_account')
  final FixedDepositAccount? fixedDepositAccount;
  final List<InvestmentHolding> _investmentHoldings;
  @override
  @JsonKey(name: 'investment_holdings')
  List<InvestmentHolding> get investmentHoldings {
    if (_investmentHoldings is EqualUnmodifiableListView)
      return _investmentHoldings;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_investmentHoldings);
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AccountCopyWith<_Account> get copyWith =>
      __$AccountCopyWithImpl<_Account>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AccountToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Account &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.accountName, accountName) ||
                other.accountName == accountName) &&
            (identical(other.accountType, accountType) ||
                other.accountType == accountType) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.isInterestEnabled, isInterestEnabled) ||
                other.isInterestEnabled == isInterestEnabled) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.savingsAccount, savingsAccount) ||
                other.savingsAccount == savingsAccount) &&
            (identical(other.loanAccount, loanAccount) ||
                other.loanAccount == loanAccount) &&
            (identical(other.fixedDepositAccount, fixedDepositAccount) ||
                other.fixedDepositAccount == fixedDepositAccount) &&
            const DeepCollectionEquality()
                .equals(other._investmentHoldings, _investmentHoldings));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      accountId,
      accountName,
      accountType,
      currency,
      status,
      isInterestEnabled,
      createdAt,
      savingsAccount,
      loanAccount,
      fixedDepositAccount,
      const DeepCollectionEquality().hash(_investmentHoldings));

  @override
  String toString() {
    return 'Account(accountId: $accountId, accountName: $accountName, accountType: $accountType, currency: $currency, status: $status, isInterestEnabled: $isInterestEnabled, createdAt: $createdAt, savingsAccount: $savingsAccount, loanAccount: $loanAccount, fixedDepositAccount: $fixedDepositAccount, investmentHoldings: $investmentHoldings)';
  }
}

/// @nodoc
abstract mixin class _$AccountCopyWith<$Res> implements $AccountCopyWith<$Res> {
  factory _$AccountCopyWith(_Account value, $Res Function(_Account) _then) =
      __$AccountCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @JsonKey(name: 'account_name') String? accountName,
      @JsonKey(name: 'account_type') AccountType accountType,
      String currency,
      String status,
      @JsonKey(name: 'is_interest_enabled') bool isInterestEnabled,
      @JsonKey(name: 'created_at') String createdAt,
      @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
      @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
      @JsonKey(name: 'fixed_deposit_account')
      FixedDepositAccount? fixedDepositAccount,
      @JsonKey(name: 'investment_holdings')
      List<InvestmentHolding> investmentHoldings});

  @override
  $SavingsAccountCopyWith<$Res>? get savingsAccount;
  @override
  $LoanAccountCopyWith<$Res>? get loanAccount;
  @override
  $FixedDepositAccountCopyWith<$Res>? get fixedDepositAccount;
}

/// @nodoc
class __$AccountCopyWithImpl<$Res> implements _$AccountCopyWith<$Res> {
  __$AccountCopyWithImpl(this._self, this._then);

  final _Account _self;
  final $Res Function(_Account) _then;

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accountId = null,
    Object? accountName = freezed,
    Object? accountType = null,
    Object? currency = null,
    Object? status = null,
    Object? isInterestEnabled = null,
    Object? createdAt = null,
    Object? savingsAccount = freezed,
    Object? loanAccount = freezed,
    Object? fixedDepositAccount = freezed,
    Object? investmentHoldings = null,
  }) {
    return _then(_Account(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: freezed == accountName
          ? _self.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String?,
      accountType: null == accountType
          ? _self.accountType
          : accountType // ignore: cast_nullable_to_non_nullable
              as AccountType,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      status: null == status
          ? _self.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      isInterestEnabled: null == isInterestEnabled
          ? _self.isInterestEnabled
          : isInterestEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      createdAt: null == createdAt
          ? _self.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String,
      savingsAccount: freezed == savingsAccount
          ? _self.savingsAccount
          : savingsAccount // ignore: cast_nullable_to_non_nullable
              as SavingsAccount?,
      loanAccount: freezed == loanAccount
          ? _self.loanAccount
          : loanAccount // ignore: cast_nullable_to_non_nullable
              as LoanAccount?,
      fixedDepositAccount: freezed == fixedDepositAccount
          ? _self.fixedDepositAccount
          : fixedDepositAccount // ignore: cast_nullable_to_non_nullable
              as FixedDepositAccount?,
      investmentHoldings: null == investmentHoldings
          ? _self._investmentHoldings
          : investmentHoldings // ignore: cast_nullable_to_non_nullable
              as List<InvestmentHolding>,
    ));
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $SavingsAccountCopyWith<$Res>? get savingsAccount {
    if (_self.savingsAccount == null) {
      return null;
    }

    return $SavingsAccountCopyWith<$Res>(_self.savingsAccount!, (value) {
      return _then(_self.copyWith(savingsAccount: value));
    });
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $LoanAccountCopyWith<$Res>? get loanAccount {
    if (_self.loanAccount == null) {
      return null;
    }

    return $LoanAccountCopyWith<$Res>(_self.loanAccount!, (value) {
      return _then(_self.copyWith(loanAccount: value));
    });
  }

  /// Create a copy of Account
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $FixedDepositAccountCopyWith<$Res>? get fixedDepositAccount {
    if (_self.fixedDepositAccount == null) {
      return null;
    }

    return $FixedDepositAccountCopyWith<$Res>(_self.fixedDepositAccount!,
        (value) {
      return _then(_self.copyWith(fixedDepositAccount: value));
    });
  }
}

/// @nodoc
mixin _$Transaction {
  @IntConverter()
  @JsonKey(name: 'transaction_id')
  int get transactionId;
  @JsonKey(name: 'account_id')
  String get accountId;
  @DoubleConverter()
  double get amount;
  @JsonKey(name: 'transaction_type')
  TransactionType get transactionType;
  String? get description;
  @OptionalIntConverter()
  @JsonKey(name: 'category_id')
  int? get categoryId;
  Category? get category;
  @JsonKey(name: 'transaction_date')
  String get transactionDate;
  String get currency;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $TransactionCopyWith<Transaction> get copyWith =>
      _$TransactionCopyWithImpl<Transaction>(this as Transaction, _$identity);

  /// Serializes this Transaction to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Transaction &&
            (identical(other.transactionId, transactionId) ||
                other.transactionId == transactionId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.transactionDate, transactionDate) ||
                other.transactionDate == transactionDate) &&
            (identical(other.currency, currency) ||
                other.currency == currency));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      transactionId,
      accountId,
      amount,
      transactionType,
      description,
      categoryId,
      category,
      transactionDate,
      currency);

  @override
  String toString() {
    return 'Transaction(transactionId: $transactionId, accountId: $accountId, amount: $amount, transactionType: $transactionType, description: $description, categoryId: $categoryId, category: $category, transactionDate: $transactionDate, currency: $currency)';
  }
}

/// @nodoc
abstract mixin class $TransactionCopyWith<$Res> {
  factory $TransactionCopyWith(
          Transaction value, $Res Function(Transaction) _then) =
      _$TransactionCopyWithImpl;
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'transaction_id') int transactionId,
      @JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double amount,
      @JsonKey(name: 'transaction_type') TransactionType transactionType,
      String? description,
      @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
      Category? category,
      @JsonKey(name: 'transaction_date') String transactionDate,
      String currency});

  $CategoryCopyWith<$Res>? get category;
}

/// @nodoc
class _$TransactionCopyWithImpl<$Res> implements $TransactionCopyWith<$Res> {
  _$TransactionCopyWithImpl(this._self, this._then);

  final Transaction _self;
  final $Res Function(Transaction) _then;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? transactionId = null,
    Object? accountId = null,
    Object? amount = null,
    Object? transactionType = null,
    Object? description = freezed,
    Object? categoryId = freezed,
    Object? category = freezed,
    Object? transactionDate = null,
    Object? currency = null,
  }) {
    return _then(_self.copyWith(
      transactionId: null == transactionId
          ? _self.transactionId
          : transactionId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _self.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      transactionType: null == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      category: freezed == category
          ? _self.category
          : category // ignore: cast_nullable_to_non_nullable
              as Category?,
      transactionDate: null == transactionDate
          ? _self.transactionDate
          : transactionDate // ignore: cast_nullable_to_non_nullable
              as String,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $CategoryCopyWith<$Res>? get category {
    if (_self.category == null) {
      return null;
    }

    return $CategoryCopyWith<$Res>(_self.category!, (value) {
      return _then(_self.copyWith(category: value));
    });
  }
}

/// Adds pattern-matching-related methods to [Transaction].
extension TransactionPatterns on Transaction {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Transaction value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Transaction() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Transaction value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Transaction():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Transaction value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Transaction() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'transaction_id') int transactionId,
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double amount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType,
            String? description,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            Category? category,
            @JsonKey(name: 'transaction_date') String transactionDate,
            String currency)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Transaction() when $default != null:
        return $default(
            _that.transactionId,
            _that.accountId,
            _that.amount,
            _that.transactionType,
            _that.description,
            _that.categoryId,
            _that.category,
            _that.transactionDate,
            _that.currency);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'transaction_id') int transactionId,
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double amount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType,
            String? description,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            Category? category,
            @JsonKey(name: 'transaction_date') String transactionDate,
            String currency)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Transaction():
        return $default(
            _that.transactionId,
            _that.accountId,
            _that.amount,
            _that.transactionType,
            _that.description,
            _that.categoryId,
            _that.category,
            _that.transactionDate,
            _that.currency);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @IntConverter() @JsonKey(name: 'transaction_id') int transactionId,
            @JsonKey(name: 'account_id') String accountId,
            @DoubleConverter() double amount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType,
            String? description,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            Category? category,
            @JsonKey(name: 'transaction_date') String transactionDate,
            String currency)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Transaction() when $default != null:
        return $default(
            _that.transactionId,
            _that.accountId,
            _that.amount,
            _that.transactionType,
            _that.description,
            _that.categoryId,
            _that.category,
            _that.transactionDate,
            _that.currency);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Transaction implements Transaction {
  const _Transaction(
      {@IntConverter()
      @JsonKey(name: 'transaction_id')
      required this.transactionId,
      @JsonKey(name: 'account_id') required this.accountId,
      @DoubleConverter() required this.amount,
      @JsonKey(name: 'transaction_type') required this.transactionType,
      this.description,
      @OptionalIntConverter() @JsonKey(name: 'category_id') this.categoryId,
      this.category,
      @JsonKey(name: 'transaction_date') required this.transactionDate,
      required this.currency});
  factory _Transaction.fromJson(Map<String, dynamic> json) =>
      _$TransactionFromJson(json);

  @override
  @IntConverter()
  @JsonKey(name: 'transaction_id')
  final int transactionId;
  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @DoubleConverter()
  final double amount;
  @override
  @JsonKey(name: 'transaction_type')
  final TransactionType transactionType;
  @override
  final String? description;
  @override
  @OptionalIntConverter()
  @JsonKey(name: 'category_id')
  final int? categoryId;
  @override
  final Category? category;
  @override
  @JsonKey(name: 'transaction_date')
  final String transactionDate;
  @override
  final String currency;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$TransactionCopyWith<_Transaction> get copyWith =>
      __$TransactionCopyWithImpl<_Transaction>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$TransactionToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Transaction &&
            (identical(other.transactionId, transactionId) ||
                other.transactionId == transactionId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.transactionDate, transactionDate) ||
                other.transactionDate == transactionDate) &&
            (identical(other.currency, currency) ||
                other.currency == currency));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      transactionId,
      accountId,
      amount,
      transactionType,
      description,
      categoryId,
      category,
      transactionDate,
      currency);

  @override
  String toString() {
    return 'Transaction(transactionId: $transactionId, accountId: $accountId, amount: $amount, transactionType: $transactionType, description: $description, categoryId: $categoryId, category: $category, transactionDate: $transactionDate, currency: $currency)';
  }
}

/// @nodoc
abstract mixin class _$TransactionCopyWith<$Res>
    implements $TransactionCopyWith<$Res> {
  factory _$TransactionCopyWith(
          _Transaction value, $Res Function(_Transaction) _then) =
      __$TransactionCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'transaction_id') int transactionId,
      @JsonKey(name: 'account_id') String accountId,
      @DoubleConverter() double amount,
      @JsonKey(name: 'transaction_type') TransactionType transactionType,
      String? description,
      @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
      Category? category,
      @JsonKey(name: 'transaction_date') String transactionDate,
      String currency});

  @override
  $CategoryCopyWith<$Res>? get category;
}

/// @nodoc
class __$TransactionCopyWithImpl<$Res> implements _$TransactionCopyWith<$Res> {
  __$TransactionCopyWithImpl(this._self, this._then);

  final _Transaction _self;
  final $Res Function(_Transaction) _then;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? transactionId = null,
    Object? accountId = null,
    Object? amount = null,
    Object? transactionType = null,
    Object? description = freezed,
    Object? categoryId = freezed,
    Object? category = freezed,
    Object? transactionDate = null,
    Object? currency = null,
  }) {
    return _then(_Transaction(
      transactionId: null == transactionId
          ? _self.transactionId
          : transactionId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      amount: null == amount
          ? _self.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      transactionType: null == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      description: freezed == description
          ? _self.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      category: freezed == category
          ? _self.category
          : category // ignore: cast_nullable_to_non_nullable
              as Category?,
      transactionDate: null == transactionDate
          ? _self.transactionDate
          : transactionDate // ignore: cast_nullable_to_non_nullable
              as String,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $CategoryCopyWith<$Res>? get category {
    if (_self.category == null) {
      return null;
    }

    return $CategoryCopyWith<$Res>(_self.category!, (value) {
      return _then(_self.copyWith(category: value));
    });
  }
}

/// @nodoc
mixin _$Rule {
  @IntConverter()
  @JsonKey(name: 'rule_id')
  int get ruleId;
  @JsonKey(name: 'account_id')
  String get accountId;
  String get name;
  @JsonKey(name: 'is_active')
  bool get isActive;
  @JsonKey(name: 'rule_type')
  RuleType get ruleType;
  @JsonKey(name: 'description_contains')
  String? get descriptionContains;
  @OptionalIntConverter()
  @JsonKey(name: 'category_id')
  int? get categoryId;
  @JsonKey(name: 'category_name')
  String? get categoryName;
  Frequency? get frequency;
  @JsonKey(name: 'next_run_at')
  String? get nextRunAt;
  @JsonKey(name: 'end_date')
  String? get endDate;
  @OptionalDoubleConverter()
  @JsonKey(name: 'transaction_amount')
  double? get transactionAmount;
  @JsonKey(name: 'transaction_type')
  TransactionType? get transactionType;
  @JsonKey(name: 'target_account_id')
  String? get targetAccountId;
  String? get formula;

  /// Create a copy of Rule
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $RuleCopyWith<Rule> get copyWith =>
      _$RuleCopyWithImpl<Rule>(this as Rule, _$identity);

  /// Serializes this Rule to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is Rule &&
            (identical(other.ruleId, ruleId) || other.ruleId == ruleId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.ruleType, ruleType) ||
                other.ruleType == ruleType) &&
            (identical(other.descriptionContains, descriptionContains) ||
                other.descriptionContains == descriptionContains) &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.categoryName, categoryName) ||
                other.categoryName == categoryName) &&
            (identical(other.frequency, frequency) ||
                other.frequency == frequency) &&
            (identical(other.nextRunAt, nextRunAt) ||
                other.nextRunAt == nextRunAt) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.transactionAmount, transactionAmount) ||
                other.transactionAmount == transactionAmount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType) &&
            (identical(other.targetAccountId, targetAccountId) ||
                other.targetAccountId == targetAccountId) &&
            (identical(other.formula, formula) || other.formula == formula));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      ruleId,
      accountId,
      name,
      isActive,
      ruleType,
      descriptionContains,
      categoryId,
      categoryName,
      frequency,
      nextRunAt,
      endDate,
      transactionAmount,
      transactionType,
      targetAccountId,
      formula);

  @override
  String toString() {
    return 'Rule(ruleId: $ruleId, accountId: $accountId, name: $name, isActive: $isActive, ruleType: $ruleType, descriptionContains: $descriptionContains, categoryId: $categoryId, categoryName: $categoryName, frequency: $frequency, nextRunAt: $nextRunAt, endDate: $endDate, transactionAmount: $transactionAmount, transactionType: $transactionType, targetAccountId: $targetAccountId, formula: $formula)';
  }
}

/// @nodoc
abstract mixin class $RuleCopyWith<$Res> {
  factory $RuleCopyWith(Rule value, $Res Function(Rule) _then) =
      _$RuleCopyWithImpl;
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'rule_id') int ruleId,
      @JsonKey(name: 'account_id') String accountId,
      String name,
      @JsonKey(name: 'is_active') bool isActive,
      @JsonKey(name: 'rule_type') RuleType ruleType,
      @JsonKey(name: 'description_contains') String? descriptionContains,
      @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
      @JsonKey(name: 'category_name') String? categoryName,
      Frequency? frequency,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'end_date') String? endDate,
      @OptionalDoubleConverter()
      @JsonKey(name: 'transaction_amount')
      double? transactionAmount,
      @JsonKey(name: 'transaction_type') TransactionType? transactionType,
      @JsonKey(name: 'target_account_id') String? targetAccountId,
      String? formula});
}

/// @nodoc
class _$RuleCopyWithImpl<$Res> implements $RuleCopyWith<$Res> {
  _$RuleCopyWithImpl(this._self, this._then);

  final Rule _self;
  final $Res Function(Rule) _then;

  /// Create a copy of Rule
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? ruleId = null,
    Object? accountId = null,
    Object? name = null,
    Object? isActive = null,
    Object? ruleType = null,
    Object? descriptionContains = freezed,
    Object? categoryId = freezed,
    Object? categoryName = freezed,
    Object? frequency = freezed,
    Object? nextRunAt = freezed,
    Object? endDate = freezed,
    Object? transactionAmount = freezed,
    Object? transactionType = freezed,
    Object? targetAccountId = freezed,
    Object? formula = freezed,
  }) {
    return _then(_self.copyWith(
      ruleId: null == ruleId
          ? _self.ruleId
          : ruleId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      isActive: null == isActive
          ? _self.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      ruleType: null == ruleType
          ? _self.ruleType
          : ruleType // ignore: cast_nullable_to_non_nullable
              as RuleType,
      descriptionContains: freezed == descriptionContains
          ? _self.descriptionContains
          : descriptionContains // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      categoryName: freezed == categoryName
          ? _self.categoryName
          : categoryName // ignore: cast_nullable_to_non_nullable
              as String?,
      frequency: freezed == frequency
          ? _self.frequency
          : frequency // ignore: cast_nullable_to_non_nullable
              as Frequency?,
      nextRunAt: freezed == nextRunAt
          ? _self.nextRunAt
          : nextRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      endDate: freezed == endDate
          ? _self.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as String?,
      transactionAmount: freezed == transactionAmount
          ? _self.transactionAmount
          : transactionAmount // ignore: cast_nullable_to_non_nullable
              as double?,
      transactionType: freezed == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType?,
      targetAccountId: freezed == targetAccountId
          ? _self.targetAccountId
          : targetAccountId // ignore: cast_nullable_to_non_nullable
              as String?,
      formula: freezed == formula
          ? _self.formula
          : formula // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// Adds pattern-matching-related methods to [Rule].
extension RulePatterns on Rule {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_Rule value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Rule() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_Rule value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Rule():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_Rule value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Rule() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'rule_id') int ruleId,
            @JsonKey(name: 'account_id') String accountId,
            String name,
            @JsonKey(name: 'is_active') bool isActive,
            @JsonKey(name: 'rule_type') RuleType ruleType,
            @JsonKey(name: 'description_contains') String? descriptionContains,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            @JsonKey(name: 'category_name') String? categoryName,
            Frequency? frequency,
            @JsonKey(name: 'next_run_at') String? nextRunAt,
            @JsonKey(name: 'end_date') String? endDate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'transaction_amount')
            double? transactionAmount,
            @JsonKey(name: 'transaction_type') TransactionType? transactionType,
            @JsonKey(name: 'target_account_id') String? targetAccountId,
            String? formula)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _Rule() when $default != null:
        return $default(
            _that.ruleId,
            _that.accountId,
            _that.name,
            _that.isActive,
            _that.ruleType,
            _that.descriptionContains,
            _that.categoryId,
            _that.categoryName,
            _that.frequency,
            _that.nextRunAt,
            _that.endDate,
            _that.transactionAmount,
            _that.transactionType,
            _that.targetAccountId,
            _that.formula);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @IntConverter() @JsonKey(name: 'rule_id') int ruleId,
            @JsonKey(name: 'account_id') String accountId,
            String name,
            @JsonKey(name: 'is_active') bool isActive,
            @JsonKey(name: 'rule_type') RuleType ruleType,
            @JsonKey(name: 'description_contains') String? descriptionContains,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            @JsonKey(name: 'category_name') String? categoryName,
            Frequency? frequency,
            @JsonKey(name: 'next_run_at') String? nextRunAt,
            @JsonKey(name: 'end_date') String? endDate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'transaction_amount')
            double? transactionAmount,
            @JsonKey(name: 'transaction_type') TransactionType? transactionType,
            @JsonKey(name: 'target_account_id') String? targetAccountId,
            String? formula)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Rule():
        return $default(
            _that.ruleId,
            _that.accountId,
            _that.name,
            _that.isActive,
            _that.ruleType,
            _that.descriptionContains,
            _that.categoryId,
            _that.categoryName,
            _that.frequency,
            _that.nextRunAt,
            _that.endDate,
            _that.transactionAmount,
            _that.transactionType,
            _that.targetAccountId,
            _that.formula);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @IntConverter() @JsonKey(name: 'rule_id') int ruleId,
            @JsonKey(name: 'account_id') String accountId,
            String name,
            @JsonKey(name: 'is_active') bool isActive,
            @JsonKey(name: 'rule_type') RuleType ruleType,
            @JsonKey(name: 'description_contains') String? descriptionContains,
            @OptionalIntConverter()
            @JsonKey(name: 'category_id')
            int? categoryId,
            @JsonKey(name: 'category_name') String? categoryName,
            Frequency? frequency,
            @JsonKey(name: 'next_run_at') String? nextRunAt,
            @JsonKey(name: 'end_date') String? endDate,
            @OptionalDoubleConverter()
            @JsonKey(name: 'transaction_amount')
            double? transactionAmount,
            @JsonKey(name: 'transaction_type') TransactionType? transactionType,
            @JsonKey(name: 'target_account_id') String? targetAccountId,
            String? formula)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _Rule() when $default != null:
        return $default(
            _that.ruleId,
            _that.accountId,
            _that.name,
            _that.isActive,
            _that.ruleType,
            _that.descriptionContains,
            _that.categoryId,
            _that.categoryName,
            _that.frequency,
            _that.nextRunAt,
            _that.endDate,
            _that.transactionAmount,
            _that.transactionType,
            _that.targetAccountId,
            _that.formula);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _Rule implements Rule {
  const _Rule(
      {@IntConverter() @JsonKey(name: 'rule_id') required this.ruleId,
      @JsonKey(name: 'account_id') required this.accountId,
      required this.name,
      @JsonKey(name: 'is_active') required this.isActive,
      @JsonKey(name: 'rule_type') required this.ruleType,
      @JsonKey(name: 'description_contains') this.descriptionContains,
      @OptionalIntConverter() @JsonKey(name: 'category_id') this.categoryId,
      @JsonKey(name: 'category_name') this.categoryName,
      this.frequency,
      @JsonKey(name: 'next_run_at') this.nextRunAt,
      @JsonKey(name: 'end_date') this.endDate,
      @OptionalDoubleConverter()
      @JsonKey(name: 'transaction_amount')
      this.transactionAmount,
      @JsonKey(name: 'transaction_type') this.transactionType,
      @JsonKey(name: 'target_account_id') this.targetAccountId,
      this.formula});
  factory _Rule.fromJson(Map<String, dynamic> json) => _$RuleFromJson(json);

  @override
  @IntConverter()
  @JsonKey(name: 'rule_id')
  final int ruleId;
  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  final String name;
  @override
  @JsonKey(name: 'is_active')
  final bool isActive;
  @override
  @JsonKey(name: 'rule_type')
  final RuleType ruleType;
  @override
  @JsonKey(name: 'description_contains')
  final String? descriptionContains;
  @override
  @OptionalIntConverter()
  @JsonKey(name: 'category_id')
  final int? categoryId;
  @override
  @JsonKey(name: 'category_name')
  final String? categoryName;
  @override
  final Frequency? frequency;
  @override
  @JsonKey(name: 'next_run_at')
  final String? nextRunAt;
  @override
  @JsonKey(name: 'end_date')
  final String? endDate;
  @override
  @OptionalDoubleConverter()
  @JsonKey(name: 'transaction_amount')
  final double? transactionAmount;
  @override
  @JsonKey(name: 'transaction_type')
  final TransactionType? transactionType;
  @override
  @JsonKey(name: 'target_account_id')
  final String? targetAccountId;
  @override
  final String? formula;

  /// Create a copy of Rule
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$RuleCopyWith<_Rule> get copyWith =>
      __$RuleCopyWithImpl<_Rule>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$RuleToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _Rule &&
            (identical(other.ruleId, ruleId) || other.ruleId == ruleId) &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.isActive, isActive) ||
                other.isActive == isActive) &&
            (identical(other.ruleType, ruleType) ||
                other.ruleType == ruleType) &&
            (identical(other.descriptionContains, descriptionContains) ||
                other.descriptionContains == descriptionContains) &&
            (identical(other.categoryId, categoryId) ||
                other.categoryId == categoryId) &&
            (identical(other.categoryName, categoryName) ||
                other.categoryName == categoryName) &&
            (identical(other.frequency, frequency) ||
                other.frequency == frequency) &&
            (identical(other.nextRunAt, nextRunAt) ||
                other.nextRunAt == nextRunAt) &&
            (identical(other.endDate, endDate) || other.endDate == endDate) &&
            (identical(other.transactionAmount, transactionAmount) ||
                other.transactionAmount == transactionAmount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType) &&
            (identical(other.targetAccountId, targetAccountId) ||
                other.targetAccountId == targetAccountId) &&
            (identical(other.formula, formula) || other.formula == formula));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      ruleId,
      accountId,
      name,
      isActive,
      ruleType,
      descriptionContains,
      categoryId,
      categoryName,
      frequency,
      nextRunAt,
      endDate,
      transactionAmount,
      transactionType,
      targetAccountId,
      formula);

  @override
  String toString() {
    return 'Rule(ruleId: $ruleId, accountId: $accountId, name: $name, isActive: $isActive, ruleType: $ruleType, descriptionContains: $descriptionContains, categoryId: $categoryId, categoryName: $categoryName, frequency: $frequency, nextRunAt: $nextRunAt, endDate: $endDate, transactionAmount: $transactionAmount, transactionType: $transactionType, targetAccountId: $targetAccountId, formula: $formula)';
  }
}

/// @nodoc
abstract mixin class _$RuleCopyWith<$Res> implements $RuleCopyWith<$Res> {
  factory _$RuleCopyWith(_Rule value, $Res Function(_Rule) _then) =
      __$RuleCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@IntConverter() @JsonKey(name: 'rule_id') int ruleId,
      @JsonKey(name: 'account_id') String accountId,
      String name,
      @JsonKey(name: 'is_active') bool isActive,
      @JsonKey(name: 'rule_type') RuleType ruleType,
      @JsonKey(name: 'description_contains') String? descriptionContains,
      @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
      @JsonKey(name: 'category_name') String? categoryName,
      Frequency? frequency,
      @JsonKey(name: 'next_run_at') String? nextRunAt,
      @JsonKey(name: 'end_date') String? endDate,
      @OptionalDoubleConverter()
      @JsonKey(name: 'transaction_amount')
      double? transactionAmount,
      @JsonKey(name: 'transaction_type') TransactionType? transactionType,
      @JsonKey(name: 'target_account_id') String? targetAccountId,
      String? formula});
}

/// @nodoc
class __$RuleCopyWithImpl<$Res> implements _$RuleCopyWith<$Res> {
  __$RuleCopyWithImpl(this._self, this._then);

  final _Rule _self;
  final $Res Function(_Rule) _then;

  /// Create a copy of Rule
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? ruleId = null,
    Object? accountId = null,
    Object? name = null,
    Object? isActive = null,
    Object? ruleType = null,
    Object? descriptionContains = freezed,
    Object? categoryId = freezed,
    Object? categoryName = freezed,
    Object? frequency = freezed,
    Object? nextRunAt = freezed,
    Object? endDate = freezed,
    Object? transactionAmount = freezed,
    Object? transactionType = freezed,
    Object? targetAccountId = freezed,
    Object? formula = freezed,
  }) {
    return _then(_Rule(
      ruleId: null == ruleId
          ? _self.ruleId
          : ruleId // ignore: cast_nullable_to_non_nullable
              as int,
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      isActive: null == isActive
          ? _self.isActive
          : isActive // ignore: cast_nullable_to_non_nullable
              as bool,
      ruleType: null == ruleType
          ? _self.ruleType
          : ruleType // ignore: cast_nullable_to_non_nullable
              as RuleType,
      descriptionContains: freezed == descriptionContains
          ? _self.descriptionContains
          : descriptionContains // ignore: cast_nullable_to_non_nullable
              as String?,
      categoryId: freezed == categoryId
          ? _self.categoryId
          : categoryId // ignore: cast_nullable_to_non_nullable
              as int?,
      categoryName: freezed == categoryName
          ? _self.categoryName
          : categoryName // ignore: cast_nullable_to_non_nullable
              as String?,
      frequency: freezed == frequency
          ? _self.frequency
          : frequency // ignore: cast_nullable_to_non_nullable
              as Frequency?,
      nextRunAt: freezed == nextRunAt
          ? _self.nextRunAt
          : nextRunAt // ignore: cast_nullable_to_non_nullable
              as String?,
      endDate: freezed == endDate
          ? _self.endDate
          : endDate // ignore: cast_nullable_to_non_nullable
              as String?,
      transactionAmount: freezed == transactionAmount
          ? _self.transactionAmount
          : transactionAmount // ignore: cast_nullable_to_non_nullable
              as double?,
      transactionType: freezed == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType?,
      targetAccountId: freezed == targetAccountId
          ? _self.targetAccountId
          : targetAccountId // ignore: cast_nullable_to_non_nullable
              as String?,
      formula: freezed == formula
          ? _self.formula
          : formula // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
mixin _$CategorySummary {
  String get name;
  @DoubleConverter()
  @JsonKey(name: 'total_amount')
  double get totalAmount;
  @JsonKey(name: 'transaction_type')
  TransactionType get transactionType;

  /// Create a copy of CategorySummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $CategorySummaryCopyWith<CategorySummary> get copyWith =>
      _$CategorySummaryCopyWithImpl<CategorySummary>(
          this as CategorySummary, _$identity);

  /// Serializes this CategorySummary to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is CategorySummary &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.totalAmount, totalAmount) ||
                other.totalAmount == totalAmount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, name, totalAmount, transactionType);

  @override
  String toString() {
    return 'CategorySummary(name: $name, totalAmount: $totalAmount, transactionType: $transactionType)';
  }
}

/// @nodoc
abstract mixin class $CategorySummaryCopyWith<$Res> {
  factory $CategorySummaryCopyWith(
          CategorySummary value, $Res Function(CategorySummary) _then) =
      _$CategorySummaryCopyWithImpl;
  @useResult
  $Res call(
      {String name,
      @DoubleConverter() @JsonKey(name: 'total_amount') double totalAmount,
      @JsonKey(name: 'transaction_type') TransactionType transactionType});
}

/// @nodoc
class _$CategorySummaryCopyWithImpl<$Res>
    implements $CategorySummaryCopyWith<$Res> {
  _$CategorySummaryCopyWithImpl(this._self, this._then);

  final CategorySummary _self;
  final $Res Function(CategorySummary) _then;

  /// Create a copy of CategorySummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? totalAmount = null,
    Object? transactionType = null,
  }) {
    return _then(_self.copyWith(
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      totalAmount: null == totalAmount
          ? _self.totalAmount
          : totalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      transactionType: null == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType,
    ));
  }
}

/// Adds pattern-matching-related methods to [CategorySummary].
extension CategorySummaryPatterns on CategorySummary {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_CategorySummary value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _CategorySummary() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_CategorySummary value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CategorySummary():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_CategorySummary value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CategorySummary() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            String name,
            @DoubleConverter()
            @JsonKey(name: 'total_amount')
            double totalAmount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _CategorySummary() when $default != null:
        return $default(_that.name, _that.totalAmount, _that.transactionType);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            String name,
            @DoubleConverter()
            @JsonKey(name: 'total_amount')
            double totalAmount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CategorySummary():
        return $default(_that.name, _that.totalAmount, _that.transactionType);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            String name,
            @DoubleConverter()
            @JsonKey(name: 'total_amount')
            double totalAmount,
            @JsonKey(name: 'transaction_type') TransactionType transactionType)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _CategorySummary() when $default != null:
        return $default(_that.name, _that.totalAmount, _that.transactionType);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _CategorySummary implements CategorySummary {
  const _CategorySummary(
      {required this.name,
      @DoubleConverter()
      @JsonKey(name: 'total_amount')
      required this.totalAmount,
      @JsonKey(name: 'transaction_type') required this.transactionType});
  factory _CategorySummary.fromJson(Map<String, dynamic> json) =>
      _$CategorySummaryFromJson(json);

  @override
  final String name;
  @override
  @DoubleConverter()
  @JsonKey(name: 'total_amount')
  final double totalAmount;
  @override
  @JsonKey(name: 'transaction_type')
  final TransactionType transactionType;

  /// Create a copy of CategorySummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$CategorySummaryCopyWith<_CategorySummary> get copyWith =>
      __$CategorySummaryCopyWithImpl<_CategorySummary>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$CategorySummaryToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _CategorySummary &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.totalAmount, totalAmount) ||
                other.totalAmount == totalAmount) &&
            (identical(other.transactionType, transactionType) ||
                other.transactionType == transactionType));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, name, totalAmount, transactionType);

  @override
  String toString() {
    return 'CategorySummary(name: $name, totalAmount: $totalAmount, transactionType: $transactionType)';
  }
}

/// @nodoc
abstract mixin class _$CategorySummaryCopyWith<$Res>
    implements $CategorySummaryCopyWith<$Res> {
  factory _$CategorySummaryCopyWith(
          _CategorySummary value, $Res Function(_CategorySummary) _then) =
      __$CategorySummaryCopyWithImpl;
  @override
  @useResult
  $Res call(
      {String name,
      @DoubleConverter() @JsonKey(name: 'total_amount') double totalAmount,
      @JsonKey(name: 'transaction_type') TransactionType transactionType});
}

/// @nodoc
class __$CategorySummaryCopyWithImpl<$Res>
    implements _$CategorySummaryCopyWith<$Res> {
  __$CategorySummaryCopyWithImpl(this._self, this._then);

  final _CategorySummary _self;
  final $Res Function(_CategorySummary) _then;

  /// Create a copy of CategorySummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? name = null,
    Object? totalAmount = null,
    Object? transactionType = null,
  }) {
    return _then(_CategorySummary(
      name: null == name
          ? _self.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      totalAmount: null == totalAmount
          ? _self.totalAmount
          : totalAmount // ignore: cast_nullable_to_non_nullable
              as double,
      transactionType: null == transactionType
          ? _self.transactionType
          : transactionType // ignore: cast_nullable_to_non_nullable
              as TransactionType,
    ));
  }
}

/// @nodoc
mixin _$AccountSummary {
  @JsonKey(name: 'account_id')
  String get accountId;
  @JsonKey(name: 'account_name')
  String? get accountName;
  @JsonKey(name: 'account_type')
  AccountType get accountType;
  String get currency;
  List<CategorySummary> get categories;

  /// Create a copy of AccountSummary
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $AccountSummaryCopyWith<AccountSummary> get copyWith =>
      _$AccountSummaryCopyWithImpl<AccountSummary>(
          this as AccountSummary, _$identity);

  /// Serializes this AccountSummary to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is AccountSummary &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.accountName, accountName) ||
                other.accountName == accountName) &&
            (identical(other.accountType, accountType) ||
                other.accountType == accountType) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            const DeepCollectionEquality()
                .equals(other.categories, categories));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, accountId, accountName,
      accountType, currency, const DeepCollectionEquality().hash(categories));

  @override
  String toString() {
    return 'AccountSummary(accountId: $accountId, accountName: $accountName, accountType: $accountType, currency: $currency, categories: $categories)';
  }
}

/// @nodoc
abstract mixin class $AccountSummaryCopyWith<$Res> {
  factory $AccountSummaryCopyWith(
          AccountSummary value, $Res Function(AccountSummary) _then) =
      _$AccountSummaryCopyWithImpl;
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @JsonKey(name: 'account_name') String? accountName,
      @JsonKey(name: 'account_type') AccountType accountType,
      String currency,
      List<CategorySummary> categories});
}

/// @nodoc
class _$AccountSummaryCopyWithImpl<$Res>
    implements $AccountSummaryCopyWith<$Res> {
  _$AccountSummaryCopyWithImpl(this._self, this._then);

  final AccountSummary _self;
  final $Res Function(AccountSummary) _then;

  /// Create a copy of AccountSummary
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accountId = null,
    Object? accountName = freezed,
    Object? accountType = null,
    Object? currency = null,
    Object? categories = null,
  }) {
    return _then(_self.copyWith(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: freezed == accountName
          ? _self.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String?,
      accountType: null == accountType
          ? _self.accountType
          : accountType // ignore: cast_nullable_to_non_nullable
              as AccountType,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      categories: null == categories
          ? _self.categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<CategorySummary>,
    ));
  }
}

/// Adds pattern-matching-related methods to [AccountSummary].
extension AccountSummaryPatterns on AccountSummary {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_AccountSummary value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _AccountSummary() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_AccountSummary value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AccountSummary():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_AccountSummary value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AccountSummary() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            List<CategorySummary> categories)?
        $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _AccountSummary() when $default != null:
        return $default(_that.accountId, _that.accountName, _that.accountType,
            _that.currency, _that.categories);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            List<CategorySummary> categories)
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AccountSummary():
        return $default(_that.accountId, _that.accountName, _that.accountType,
            _that.currency, _that.categories);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(
            @JsonKey(name: 'account_id') String accountId,
            @JsonKey(name: 'account_name') String? accountName,
            @JsonKey(name: 'account_type') AccountType accountType,
            String currency,
            List<CategorySummary> categories)?
        $default,
  ) {
    final _that = this;
    switch (_that) {
      case _AccountSummary() when $default != null:
        return $default(_that.accountId, _that.accountName, _that.accountType,
            _that.currency, _that.categories);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _AccountSummary implements AccountSummary {
  const _AccountSummary(
      {@JsonKey(name: 'account_id') required this.accountId,
      @JsonKey(name: 'account_name') this.accountName,
      @JsonKey(name: 'account_type') required this.accountType,
      required this.currency,
      required final List<CategorySummary> categories})
      : _categories = categories;
  factory _AccountSummary.fromJson(Map<String, dynamic> json) =>
      _$AccountSummaryFromJson(json);

  @override
  @JsonKey(name: 'account_id')
  final String accountId;
  @override
  @JsonKey(name: 'account_name')
  final String? accountName;
  @override
  @JsonKey(name: 'account_type')
  final AccountType accountType;
  @override
  final String currency;
  final List<CategorySummary> _categories;
  @override
  List<CategorySummary> get categories {
    if (_categories is EqualUnmodifiableListView) return _categories;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_categories);
  }

  /// Create a copy of AccountSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$AccountSummaryCopyWith<_AccountSummary> get copyWith =>
      __$AccountSummaryCopyWithImpl<_AccountSummary>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$AccountSummaryToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _AccountSummary &&
            (identical(other.accountId, accountId) ||
                other.accountId == accountId) &&
            (identical(other.accountName, accountName) ||
                other.accountName == accountName) &&
            (identical(other.accountType, accountType) ||
                other.accountType == accountType) &&
            (identical(other.currency, currency) ||
                other.currency == currency) &&
            const DeepCollectionEquality()
                .equals(other._categories, _categories));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, accountId, accountName,
      accountType, currency, const DeepCollectionEquality().hash(_categories));

  @override
  String toString() {
    return 'AccountSummary(accountId: $accountId, accountName: $accountName, accountType: $accountType, currency: $currency, categories: $categories)';
  }
}

/// @nodoc
abstract mixin class _$AccountSummaryCopyWith<$Res>
    implements $AccountSummaryCopyWith<$Res> {
  factory _$AccountSummaryCopyWith(
          _AccountSummary value, $Res Function(_AccountSummary) _then) =
      __$AccountSummaryCopyWithImpl;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'account_id') String accountId,
      @JsonKey(name: 'account_name') String? accountName,
      @JsonKey(name: 'account_type') AccountType accountType,
      String currency,
      List<CategorySummary> categories});
}

/// @nodoc
class __$AccountSummaryCopyWithImpl<$Res>
    implements _$AccountSummaryCopyWith<$Res> {
  __$AccountSummaryCopyWithImpl(this._self, this._then);

  final _AccountSummary _self;
  final $Res Function(_AccountSummary) _then;

  /// Create a copy of AccountSummary
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accountId = null,
    Object? accountName = freezed,
    Object? accountType = null,
    Object? currency = null,
    Object? categories = null,
  }) {
    return _then(_AccountSummary(
      accountId: null == accountId
          ? _self.accountId
          : accountId // ignore: cast_nullable_to_non_nullable
              as String,
      accountName: freezed == accountName
          ? _self.accountName
          : accountName // ignore: cast_nullable_to_non_nullable
              as String?,
      accountType: null == accountType
          ? _self.accountType
          : accountType // ignore: cast_nullable_to_non_nullable
              as AccountType,
      currency: null == currency
          ? _self.currency
          : currency // ignore: cast_nullable_to_non_nullable
              as String,
      categories: null == categories
          ? _self._categories
          : categories // ignore: cast_nullable_to_non_nullable
              as List<CategorySummary>,
    ));
  }
}

/// @nodoc
mixin _$SummaryResponse {
  List<AccountSummary> get accounts;

  /// Create a copy of SummaryResponse
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  $SummaryResponseCopyWith<SummaryResponse> get copyWith =>
      _$SummaryResponseCopyWithImpl<SummaryResponse>(
          this as SummaryResponse, _$identity);

  /// Serializes this SummaryResponse to a JSON map.
  Map<String, dynamic> toJson();

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is SummaryResponse &&
            const DeepCollectionEquality().equals(other.accounts, accounts));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(accounts));

  @override
  String toString() {
    return 'SummaryResponse(accounts: $accounts)';
  }
}

/// @nodoc
abstract mixin class $SummaryResponseCopyWith<$Res> {
  factory $SummaryResponseCopyWith(
          SummaryResponse value, $Res Function(SummaryResponse) _then) =
      _$SummaryResponseCopyWithImpl;
  @useResult
  $Res call({List<AccountSummary> accounts});
}

/// @nodoc
class _$SummaryResponseCopyWithImpl<$Res>
    implements $SummaryResponseCopyWith<$Res> {
  _$SummaryResponseCopyWithImpl(this._self, this._then);

  final SummaryResponse _self;
  final $Res Function(SummaryResponse) _then;

  /// Create a copy of SummaryResponse
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? accounts = null,
  }) {
    return _then(_self.copyWith(
      accounts: null == accounts
          ? _self.accounts
          : accounts // ignore: cast_nullable_to_non_nullable
              as List<AccountSummary>,
    ));
  }
}

/// Adds pattern-matching-related methods to [SummaryResponse].
extension SummaryResponsePatterns on SummaryResponse {
  /// A variant of `map` that fallback to returning `orElse`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>(
    TResult Function(_SummaryResponse value)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse() when $default != null:
        return $default(_that);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// Callbacks receives the raw object, upcasted.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case final Subclass2 value:
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult map<TResult extends Object?>(
    TResult Function(_SummaryResponse value) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse():
        return $default(_that);
    }
  }

  /// A variant of `map` that fallback to returning `null`.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case final Subclass value:
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>(
    TResult? Function(_SummaryResponse value)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse() when $default != null:
        return $default(_that);
      case _:
        return null;
    }
  }

  /// A variant of `when` that fallback to an `orElse` callback.
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return orElse();
  /// }
  /// ```

  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>(
    TResult Function(List<AccountSummary> accounts)? $default, {
    required TResult orElse(),
  }) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse() when $default != null:
        return $default(_that.accounts);
      case _:
        return orElse();
    }
  }

  /// A `switch`-like method, using callbacks.
  ///
  /// As opposed to `map`, this offers destructuring.
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case Subclass2(:final field2):
  ///     return ...;
  /// }
  /// ```

  @optionalTypeArgs
  TResult when<TResult extends Object?>(
    TResult Function(List<AccountSummary> accounts) $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse():
        return $default(_that.accounts);
    }
  }

  /// A variant of `when` that fallback to returning `null`
  ///
  /// It is equivalent to doing:
  /// ```dart
  /// switch (sealedClass) {
  ///   case Subclass(:final field):
  ///     return ...;
  ///   case _:
  ///     return null;
  /// }
  /// ```

  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>(
    TResult? Function(List<AccountSummary> accounts)? $default,
  ) {
    final _that = this;
    switch (_that) {
      case _SummaryResponse() when $default != null:
        return $default(_that.accounts);
      case _:
        return null;
    }
  }
}

/// @nodoc
@JsonSerializable()
class _SummaryResponse implements SummaryResponse {
  const _SummaryResponse({required final List<AccountSummary> accounts})
      : _accounts = accounts;
  factory _SummaryResponse.fromJson(Map<String, dynamic> json) =>
      _$SummaryResponseFromJson(json);

  final List<AccountSummary> _accounts;
  @override
  List<AccountSummary> get accounts {
    if (_accounts is EqualUnmodifiableListView) return _accounts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_accounts);
  }

  /// Create a copy of SummaryResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  @pragma('vm:prefer-inline')
  _$SummaryResponseCopyWith<_SummaryResponse> get copyWith =>
      __$SummaryResponseCopyWithImpl<_SummaryResponse>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$SummaryResponseToJson(
      this,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _SummaryResponse &&
            const DeepCollectionEquality().equals(other._accounts, _accounts));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_accounts));

  @override
  String toString() {
    return 'SummaryResponse(accounts: $accounts)';
  }
}

/// @nodoc
abstract mixin class _$SummaryResponseCopyWith<$Res>
    implements $SummaryResponseCopyWith<$Res> {
  factory _$SummaryResponseCopyWith(
          _SummaryResponse value, $Res Function(_SummaryResponse) _then) =
      __$SummaryResponseCopyWithImpl;
  @override
  @useResult
  $Res call({List<AccountSummary> accounts});
}

/// @nodoc
class __$SummaryResponseCopyWithImpl<$Res>
    implements _$SummaryResponseCopyWith<$Res> {
  __$SummaryResponseCopyWithImpl(this._self, this._then);

  final _SummaryResponse _self;
  final $Res Function(_SummaryResponse) _then;

  /// Create a copy of SummaryResponse
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $Res call({
    Object? accounts = null,
  }) {
    return _then(_SummaryResponse(
      accounts: null == accounts
          ? _self._accounts
          : accounts // ignore: cast_nullable_to_non_nullable
              as List<AccountSummary>,
    ));
  }
}

// dart format on
